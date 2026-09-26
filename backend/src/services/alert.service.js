import { JobAlert } from "../models/jobAlert.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { notify } from "../utils/notify.js";
import { sendJobAlertDigest } from "../utils/mail.service.js";

const HOUR = 60 * 60 * 1000;
export const ALERT_INTERVAL_MS = { daily: 23 * HOUR, weekly: 6.9 * 24 * HOUR };
const MAX_JOBS_PER_DIGEST = 10;

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** MongoDB filter for the open jobs an alert is interested in, created after `since`. */
export const buildAlertFilter = (alert, since) => {
  const filter = { isActive: true, createdAt: { $gt: since }, applicationDeadline: { $gte: new Date() } };

  if (alert.keyword) {
    const rx = new RegExp(escapeRegex(alert.keyword), "i");
    filter.$or = [{ title: rx }, { skills: rx }, { tags: rx }];
  }
  if (alert.location) filter.location = new RegExp(escapeRegex(alert.location), "i");
  if (alert.category) filter.category = alert.category;
  if (alert.jobType) filter.jobType = alert.jobType;
  if (alert.workMode) filter.workMode = alert.workMode;
  if (alert.minSalary) filter["salary.max"] = { $gte: alert.minSalary };
  return filter;
};

/** Same criteria evaluated in memory, used to test a single freshly-posted job. */
export const jobMatchesAlert = (job, alert) => {
  const has = (haystack, needle) => String(haystack || "").toLowerCase().includes(String(needle).toLowerCase());
  if (alert.keyword) {
    const inTitle = has(job.title, alert.keyword);
    const inSkills = (job.skills || []).some((s) => has(s, alert.keyword));
    const inTags = (job.tags || []).some((t) => has(t, alert.keyword));
    if (!inTitle && !inSkills && !inTags) return false;
  }
  if (alert.location && !has(job.location, alert.location)) return false;
  if (alert.category && job.category !== alert.category) return false;
  if (alert.jobType && job.jobType !== alert.jobType) return false;
  if (alert.workMode && job.workMode !== alert.workMode) return false;
  if (alert.minSalary && (job.salary?.max || 0) < alert.minSalary) return false;
  return true;
};

const describeAlert = (alert) =>
  alert.name ||
  [alert.keyword, alert.location, alert.jobType, alert.workMode].filter(Boolean).join(" · ") ||
  "All jobs";

const toDigestJob = (job) => ({
  _id: job._id,
  title: job.title,
  location: job.location,
  companyName: job.company?.companyName || "A company",
});

/**
 * Emails (and notifies) the alert owner about jobs newer than `since`.
 * Returns how many jobs were reported.
 */
export const sendAlertDigest = async (alert, since = alert.lastCheckedAt) => {
  const user = await User.findById(alert.user).select("name email isSuspended");
  const now = new Date();

  if (!user || user.isSuspended) {
    alert.lastCheckedAt = now;
    await alert.save();
    return 0;
  }

  const jobs = await Job.find(buildAlertFilter(alert, since))
    .populate("company", "companyName")
    .sort({ createdAt: -1 })
    .limit(MAX_JOBS_PER_DIGEST);

  alert.lastCheckedAt = now;
  if (jobs.length) alert.lastSentAt = now;
  await alert.save();

  if (!jobs.length) return 0;

  const label = describeAlert(alert);
  void sendJobAlertDigest({ to: user.email, name: user.name, alertName: label, jobs: jobs.map(toDigestJob) });
  void notify(user._id, {
    type: "job_alert",
    title: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} for "${label}"`,
    message: jobs
      .slice(0, 3)
      .map((j) => j.title)
      .join(", "),
    link: "/jobs",
    data: { alertId: alert._id },
  });
  return jobs.length;
};

/** Called by the scheduler: sends every daily/weekly digest that is due. */
export const runDueJobAlerts = async () => {
  const now = Date.now();
  const alerts = await JobAlert.find({ isActive: true, frequency: { $in: ["daily", "weekly"] } });
  let sent = 0;
  let checked = 0;
  for (const alert of alerts) {
    const due = now - new Date(alert.lastCheckedAt || 0).getTime() >= ALERT_INTERVAL_MS[alert.frequency];
    if (!due) continue;
    checked += 1;
    try {
      sent += await sendAlertDigest(alert);
    } catch (error) {
      console.error(`[alerts] digest failed for alert ${alert._id}:`, error.message);
    }
  }
  return { checked, jobsReported: sent };
};

/** Called when an employer posts a job: notifies owners of matching "instant" alerts. */
export const notifyInstantAlerts = async (job) => {
  try {
    const alerts = await JobAlert.find({ isActive: true, frequency: "instant" });
    const populated = await Job.findById(job._id).populate("company", "companyName");
    for (const alert of alerts) {
      if (!jobMatchesAlert(populated, alert)) continue;
      if (String(alert.user) === String(populated.postedBy)) continue;
      const user = await User.findById(alert.user).select("name email isSuspended");
      if (!user || user.isSuspended) continue;
      alert.lastSentAt = new Date();
      await alert.save();
      const label = describeAlert(alert);
      void sendJobAlertDigest({ to: user.email, name: user.name, alertName: label, jobs: [toDigestJob(populated)] });
      void notify(user._id, {
        type: "job_alert",
        title: `New job for "${label}"`,
        message: `${populated.title} at ${populated.company?.companyName || "a company"}`,
        link: `/jobs/${populated._id}`,
        data: { alertId: alert._id, jobId: populated._id },
      });
    }
  } catch (error) {
    console.error("[alerts] instant alert dispatch failed:", error.message);
  }
};
