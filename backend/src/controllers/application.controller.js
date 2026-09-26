import { Application } from "../models/application.model.js";
import { Interview } from "../models/interview.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { computeMatch, candidateFromUser } from "../utils/matchScore.js";
import {
  APPLICATION_STATUSES,
  assertJobOwner,
  changeApplicationStatus,
} from "../services/application.service.js";

const profileSummary = (user) => {
  const c = candidateFromUser(user);
  const profile = user.jobSeekerProfile?.toObject?.() ?? user.jobSeekerProfile ?? {};
  const legacy = user.userProfile ?? {};
  return {
    profilePicture: profile.profilePicture || legacy.profilePicture,
    primaryRole: c.primaryRole,
    skills: c.skills,
    yearsOfExperience: c.yearsOfExperience,
    location: c.location,
    resume: profile.resume || legacy.resume,
  };
};

// Employer: every application for one job, grouped by pipeline stage, ranked with match scores
export const getJobPipeline = asyncHandler(async (req, res) => {
  const job = await assertJobOwner(req.params.jobId, req.user._id);

  const applications = await Application.find({ job: job._id })
    .populate({ path: "applicant", select: "name email userProfile jobSeekerProfile", populate: "jobSeekerProfile" })
    .sort({ appliedAt: -1 });

  const interviews = await Interview.find({
    job: job._id,
    status: { $in: ["proposed", "confirmed"] },
  }).select("application status selectedSlot slots");
  const interviewByApplication = new Map(interviews.map((i) => [i.application.toString(), i]));

  const columns = Object.fromEntries(APPLICATION_STATUSES.map((status) => [status, []]));

  for (const application of applications) {
    if (!application.applicant) continue; // applicant account was deleted
    const match = computeMatch(candidateFromUser(application.applicant), job);
    const interview = interviewByApplication.get(application._id.toString());
    columns[application.status]?.push({
      _id: application._id,
      status: application.status,
      appliedAt: application.appliedAt,
      coverLetter: application.coverLetter,
      resume: application.resume,
      statusHistory: application.statusHistory,
      applicant: {
        _id: application.applicant._id,
        name: application.applicant.name,
        email: application.applicant.email,
        ...profileSummary(application.applicant),
      },
      match: {
        score: match.score,
        label: match.label,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
      },
      interview: interview
        ? { _id: interview._id, status: interview.status, selectedSlot: interview.selectedSlot, slots: interview.slots }
        : null,
    });
  }

  const counts = Object.fromEntries(Object.entries(columns).map(([k, v]) => [k, v.length]));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        job: { _id: job._id, title: job.title, location: job.location, isActive: job.isActive, skills: job.skills },
        columns,
        counts,
        total: applications.length,
      },
      "Pipeline fetched"
    )
  );
});

// Employer: move an application to another stage (drag and drop on the board)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const application = await Application.findById(req.params.id);
  if (!application) throw new ApiError(404, "Application not found");

  const job = await assertJobOwner(application.job, req.user._id);
  await changeApplicationStatus({ application, job, status, actorId: req.user._id, note });

  return res.status(200).json(new ApiResponse(200, application, "Application status updated"));
});

// Job seeker: own applications with the full status timeline and any interview
export const getMyApplicationsDetailed = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate({
      path: "job",
      select: "title location salary jobType workMode company isActive",
      populate: { path: "company", select: "companyName companyLogo" },
    })
    .sort({ appliedAt: -1 });

  const interviews = await Interview.find({ candidate: req.user._id }).sort({ createdAt: -1 });
  const interviewByApplication = new Map();
  for (const interview of interviews) {
    const key = interview.application.toString();
    if (!interviewByApplication.has(key)) interviewByApplication.set(key, interview); // newest first
  }

  const data = applications
    .filter((application) => application.job) // job may have been removed
    .map((application) => ({
      ...application.toObject(),
      timeline: application.statusHistory,
      interview: interviewByApplication.get(application._id.toString()) ?? null,
    }));

  return res.status(200).json(new ApiResponse(200, data, "Applications fetched"));
});

// ---- Match scores -----------------------------------------------------------

const loadCandidate = async (userId) => {
  const user = await User.findById(userId).populate("jobSeekerProfile");
  return candidateFromUser(user);
};

// Job seeker: batch scores for a page of job cards
export const getMatchScores = asyncHandler(async (req, res) => {
  const { jobIds } = req.body;
  const candidate = await loadCandidate(req.user._id);
  const jobs = await Job.find({ _id: { $in: jobIds } }).select("skills experience location workMode jobType title");

  const scores = {};
  for (const job of jobs) {
    const match = computeMatch(candidate, job);
    scores[job._id.toString()] = {
      score: match.score,
      label: match.label,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
    };
  }
  return res.status(200).json(new ApiResponse(200, { scores }, "Match scores computed"));
});

// Job seeker: detailed breakdown for one job
export const getJobMatch = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select("skills experience location workMode jobType title");
  if (!job) throw new ApiError(404, "Job not found");
  const candidate = await loadCandidate(req.user._id);
  return res.status(200).json(new ApiResponse(200, computeMatch(candidate, job), "Match computed"));
});
