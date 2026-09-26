import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { Interview } from "../models/interview.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const DAY = 24 * 60 * 60 * 1000;
const STAGES = ["pending", "reviewed", "shortlisted", "interview", "hired"];
const STAGE_LABELS = {
  pending: "Applied",
  reviewed: "Reviewed",
  shortlisted: "Shortlisted",
  interview: "Interview",
  hired: "Hired",
};

const isoDay = (date) => new Date(date).toISOString().slice(0, 10);
const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0);
const round1 = (n) => Math.round(n * 10) / 10;

/** Highest pipeline stage this application ever reached (rejected candidates keep their peak). */
export const peakStageIndex = (application) => {
  const seen = new Set([application.status, ...(application.statusHistory || []).map((h) => h.status)]);
  let peak = 0;
  for (const status of seen) {
    const index = STAGES.indexOf(status);
    if (index > peak) peak = index;
  }
  return peak;
};

export const getCompanyAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const since = new Date(Date.now() - days * DAY);

  const jobs = await Job.find({ postedBy: req.user._id })
    .select("title isActive viewCount applicationCount createdAt")
    .lean();
  const jobIds = jobs.map((j) => j._id);

  const [applications, interviews] = await Promise.all([
    Application.find({ job: { $in: jobIds } })
      .select("job status statusHistory appliedAt createdAt reviewedAt")
      .lean(),
    Interview.find({ employer: req.user._id }).select("status createdAt").lean(),
  ]);

  // --- Summary
  const totalViews = jobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);
  const hired = applications.filter((a) => a.status === "hired");
  const appliedAt = (a) => new Date(a.appliedAt || a.createdAt);

  const hiredAt = (a) => {
    const entry = [...(a.statusHistory || [])].reverse().find((h) => h.status === "hired");
    return entry?.changedAt ? new Date(entry.changedAt) : a.reviewedAt ? new Date(a.reviewedAt) : null;
  };
  const timeToHire = hired
    .map((a) => {
      const end = hiredAt(a);
      return end ? (end - appliedAt(a)) / DAY : null;
    })
    .filter((n) => n !== null && n >= 0);

  const responseHours = applications
    .map((a) => {
      const first = (a.statusHistory || []).find((h, i) => i > 0 && h.status !== "pending");
      const at = first?.changedAt || a.reviewedAt;
      return at ? (new Date(at) - appliedAt(a)) / (60 * 60 * 1000) : null;
    })
    .filter((n) => n !== null && n >= 0);

  // --- Funnel (how many applicants reached each stage)
  const peaks = applications.map(peakStageIndex);
  const funnel = STAGES.map((stage, index) => ({
    stage,
    label: STAGE_LABELS[stage],
    count: peaks.filter((peak) => peak >= index).length,
  }));
  const rejected = applications.filter((a) => a.status === "rejected").length;

  // --- Applications per day for the selected range
  const perDay = new Map();
  for (let i = days - 1; i >= 0; i--) perDay.set(isoDay(new Date(Date.now() - i * DAY)), 0);
  for (const a of applications) {
    const key = isoDay(appliedAt(a));
    if (perDay.has(key)) perDay.set(key, perDay.get(key) + 1);
  }
  const applicationsOverTime = [...perDay.entries()].map(([date, count]) => ({ date, count }));

  // --- Trend vs the previous period of equal length
  const inRange = applications.filter((a) => appliedAt(a) >= since).length;
  const previous = applications.filter((a) => {
    const t = appliedAt(a);
    return t < since && t >= new Date(since.getTime() - days * DAY);
  }).length;
  const trendPercent = previous ? Math.round(((inRange - previous) / previous) * 100) : inRange ? 100 : 0;

  // --- Per-job performance
  const perJob = new Map(jobs.map((j) => [String(j._id), { applications: 0, hires: 0 }]));
  for (const a of applications) {
    const row = perJob.get(String(a.job));
    if (!row) continue;
    row.applications += 1;
    if (a.status === "hired") row.hires += 1;
  }
  const topJobs = jobs
    .map((job) => {
      const row = perJob.get(String(job._id));
      const views = job.viewCount || 0;
      return {
        _id: job._id,
        title: job.title,
        isActive: job.isActive,
        views,
        applications: row.applications,
        hires: row.hires,
        conversionPercent: views ? round1((row.applications / views) * 100) : 0,
      };
    })
    .sort((a, b) => b.applications - a.applications || b.views - a.views)
    .slice(0, 8);

  const statusBreakdown = ["pending", "reviewed", "shortlisted", "interview", "hired", "rejected"].map((status) => ({
    status,
    count: applications.filter((a) => a.status === status).length,
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rangeDays: days,
        summary: {
          totalJobs: jobs.length,
          activeJobs: jobs.filter((j) => j.isActive).length,
          totalViews,
          totalApplications: applications.length,
          applicationsInRange: inRange,
          trendPercent,
          avgApplicationsPerJob: jobs.length ? round1(applications.length / jobs.length) : 0,
          conversionPercent: totalViews ? round1((applications.length / totalViews) * 100) : 0,
          hires: hired.length,
          avgTimeToHireDays: round1(avg(timeToHire)),
          avgFirstResponseHours: round1(avg(responseHours)),
          interviewsScheduled: interviews.filter((i) => ["proposed", "confirmed", "completed"].includes(i.status)).length,
          interviewsConfirmed: interviews.filter((i) => ["confirmed", "completed"].includes(i.status)).length,
        },
        funnel,
        rejected,
        statusBreakdown,
        applicationsOverTime,
        topJobs,
      },
      "Analytics computed"
    )
  );
});
