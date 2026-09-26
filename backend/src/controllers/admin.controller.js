import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { Interview } from "../models/interview.model.js";
import { CompanyReview } from "../models/companyReview.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { JobAlert } from "../models/jobAlert.model.js";
import { Notification } from "../models/notification.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";
import { runDueJobAlerts } from "../services/alert.service.js";

const DAY = 24 * 60 * 60 * 1000;
const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const paging = (query) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

const pageInfo = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) || 1 });

/** Counts documents per day for the last `days` days, filling gaps with zero. */
const dailySeries = async (Model, days, dateField = "createdAt", extraMatch = {}) => {
  const since = new Date(Date.now() - (days - 1) * DAY);
  since.setUTCHours(0, 0, 0, 0);
  const rows = await Model.aggregate([
    { $match: { [dateField]: { $gte: since }, ...extraMatch } },
    { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` } }, count: { $sum: 1 } } },
  ]);
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(since.getTime() + i * DAY).toISOString().slice(0, 10);
    return { date, count: byDay.get(date) || 0 };
  });
};

export const getPlatformStats = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));

  const [
    totalUsers,
    jobSeekers,
    employers,
    admins,
    suspended,
    unverified,
    totalJobs,
    activeJobs,
    totalApplications,
    applicationsByStatus,
    reviews,
    interviews,
    jobsByCategory,
    signups,
    jobsPosted,
    applicationsSent,
    applicationsPerJob,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "jobSeeker" }),
    User.countDocuments({ role: "employer" }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ isSuspended: true }),
    User.countDocuments({ emailVerified: false }),
    Job.countDocuments(),
    Job.countDocuments({ isActive: true }),
    Application.countDocuments(),
    Application.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    CompanyReview.countDocuments(),
    Interview.countDocuments(),
    Job.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 8 }]),
    dailySeries(User, days),
    dailySeries(Job, days),
    dailySeries(Application, days, "appliedAt"),
    Application.aggregate([
      { $group: { _id: "$job", count: { $sum: 1 } } },
      { $lookup: { from: "jobs", localField: "_id", foreignField: "_id", as: "job" } },
      { $unwind: "$job" },
      { $group: { _id: "$job.company", applications: { $sum: "$count" }, jobs: { $sum: 1 } } },
      { $sort: { applications: -1 } },
      { $limit: 5 },
      { $lookup: { from: "companyprofiles", localField: "_id", foreignField: "_id", as: "company" } },
      { $project: { applications: 1, jobs: 1, name: { $arrayElemAt: ["$company.companyName", 0] } } },
    ]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        rangeDays: days,
        totals: {
          users: totalUsers,
          jobSeekers,
          employers,
          admins,
          suspended,
          unverified,
          jobs: totalJobs,
          activeJobs,
          applications: totalApplications,
          reviews,
          interviews,
        },
        applicationsByStatus: applicationsByStatus.map((r) => ({ status: r._id, count: r.count })),
        jobsByCategory: jobsByCategory.map((r) => ({ category: r._id || "other", count: r.count })),
        topCompanies: applicationsPerJob.map((r) => ({ name: r.name || "Unknown", applications: r.applications, jobs: r.jobs })),
        series: { signups, jobs: jobsPosted, applications: applicationsSent },
      },
      "Platform statistics"
    )
  );
});

// ---- Users -----------------------------------------------------------------------

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query);
  const { search, role, status } = req.query;

  const filter = {};
  if (role && ["jobSeeker", "employer", "admin"].includes(role)) filter.role = role;
  if (status === "suspended") filter.isSuspended = true;
  if (status === "active") filter.isSuspended = { $ne: true };
  if (status === "unverified") filter.emailVerified = false;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: rx }, { email: rx }, { username: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("name email role emailVerified isSuspended suspendedReason createdAt lastLoginAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, { users, pagination: pageInfo(page, limit, total) }, "Users fetched"));
});

const loadManageableUser = async (id, actor) => {
  const target = await User.findById(id);
  if (!target) throw new ApiError(404, "User not found");
  if (String(target._id) === String(actor._id)) throw new ApiError(400, "You cannot do this to your own account");
  if (target.role === "admin") throw new ApiError(403, "Administrator accounts cannot be moderated here");
  return target;
};

export const setUserSuspension = asyncHandler(async (req, res) => {
  const { suspended, reason } = req.body;
  const target = await loadManageableUser(req.params.id, req.user);

  target.isSuspended = suspended;
  target.suspendedReason = suspended ? reason || "Violation of platform rules" : undefined;
  target.suspendedAt = suspended ? new Date() : undefined;
  if (suspended) target.refreshToken = undefined; // ends any refresh-token session
  await target.save({ validateBeforeSave: false });

  if (!suspended) {
    void notify(target._id, { type: "system", title: "Account restored", message: "Your Kormopulse account is active again." });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { _id: target._id, isSuspended: target.isSuspended }, suspended ? "User suspended" : "User reinstated"));
});

/** Removes a user and everything that only makes sense together with them. */
export const deleteUserCascade = async (user) => {
  if (user.role === "employer") {
    const jobs = await Job.find({ postedBy: user._id }).select("_id");
    const jobIds = jobs.map((j) => j._id);
    await Promise.all([
      Application.deleteMany({ job: { $in: jobIds } }),
      Interview.deleteMany({ $or: [{ employer: user._id }, { job: { $in: jobIds } }] }),
      Job.deleteMany({ postedBy: user._id }),
    ]);
    if (user.companyProfile) {
      await CompanyReview.deleteMany({ company: user.companyProfile });
      await CompanyProfile.findByIdAndDelete(user.companyProfile);
    }
  } else {
    await Promise.all([
      Application.deleteMany({ applicant: user._id }),
      Interview.deleteMany({ candidate: user._id }),
      JobAlert.deleteMany({ user: user._id }),
      CompanyReview.deleteMany({ user: user._id }),
    ]);
    if (user.jobSeekerProfile) await JobSeekerProfile.findByIdAndDelete(user.jobSeekerProfile);
    // Remove the candidate from the legacy embedded applicant lists
    await Job.updateMany({}, { $pull: { applicants: { user: user._id }, shortlistedCandidates: user._id } });
  }
  await Promise.all([
    Notification.deleteMany({ user: user._id }),
    Message.deleteMany({ $or: [{ from: user._id }, { to: user._id }] }),
  ]);
  await User.findByIdAndDelete(user._id);
};

export const deleteUser = asyncHandler(async (req, res) => {
  const target = await loadManageableUser(req.params.id, req.user);
  await deleteUserCascade(target);
  return res.status(200).json(new ApiResponse(200, {}, "User and related data deleted"));
});

// ---- Jobs -------------------------------------------------------------------------

export const listAllJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query);
  const { search, status } = req.query;

  const filter = {};
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;
  if (search) filter.title = new RegExp(escapeRegex(search), "i");

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .select("title location isActive category applicationCount viewCount createdAt company postedBy")
      .populate("company", "companyName")
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  return res.status(200).json(new ApiResponse(200, { jobs, pagination: pageInfo(page, limit, total) }, "Jobs fetched"));
});

export const setJobStatus = asyncHandler(async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true }).select(
    "title isActive postedBy"
  );
  if (!job) throw new ApiError(404, "Job not found");

  if (!job.isActive) {
    void notify(job.postedBy, {
      type: "system",
      title: "A job posting was deactivated",
      message: `"${job.title}" was deactivated by a moderator.`,
      link: "/dashboard/home",
    });
  }
  return res.status(200).json(new ApiResponse(200, job, job.isActive ? "Job activated" : "Job deactivated"));
});

export const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, "Job not found");
  await Promise.all([
    Application.deleteMany({ job: job._id }),
    Interview.deleteMany({ job: job._id }),
    Job.findByIdAndDelete(job._id),
  ]);
  return res.status(200).json(new ApiResponse(200, {}, "Job and its applications deleted"));
});

// ---- Reviews ------------------------------------------------------------------------

export const listAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paging(req.query);
  const [reviews, total] = await Promise.all([
    CompanyReview.find()
      .populate("company", "companyName")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CompanyReview.countDocuments(),
  ]);
  return res.status(200).json(new ApiResponse(200, { reviews, pagination: pageInfo(page, limit, total) }, "Reviews fetched"));
});

// ---- Maintenance ------------------------------------------------------------------------

export const triggerJobAlerts = asyncHandler(async (_req, res) => {
  const result = await runDueJobAlerts();
  return res.status(200).json(new ApiResponse(200, result, "Job alert run finished"));
});
