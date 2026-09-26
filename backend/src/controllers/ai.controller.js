import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { extractResumeText } from "../utils/resumeText.js";
import { candidateFromUser } from "../utils/matchScore.js";
import { getCompanyName } from "../services/application.service.js";
import {
  parseResume,
  sanitizeParsedProfile,
  generateCoverLetter,
  generateInterviewPrep,
  isAiConfigured,
} from "../services/ai.service.js";

const loadSeeker = async (userId) => User.findById(userId).populate("jobSeekerProfile");

const aiCandidate = (user) => {
  const base = candidateFromUser(user);
  const profile = user.jobSeekerProfile?.toObject?.() ?? user.jobSeekerProfile ?? {};
  const experience = profile.workExperience?.length ? profile.workExperience : user.userProfile?.workExperience || [];
  return {
    ...base,
    name: user.name,
    recentExperience: experience.slice(0, 3).map((w) => `${w.jobTitle}${w.company?.name ? ` at ${w.company.name}` : ""}`),
  };
};

// ---- Resume import ------------------------------------------------------------

// Reads an uploaded resume and returns a preview. Nothing is saved yet.
export const parseResumeUpload = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Attach a resume file in the 'resume' field");
  const text = await extractResumeText(req.file);
  const { source, profile } = await parseResume(text);

  return res.status(200).json(
    new ApiResponse(
      200,
      { source, aiConfigured: isAiConfigured(), characters: text.length, profile },
      source === "ai" ? "Resume analysed with AI" : "Resume read with rule-based extraction. Please review the result."
    )
  );
});

const norm = (value) => String(value || "").trim().toLowerCase();
const monthToDate = (value) => (value ? new Date(`${value}-01T00:00:00.000Z`) : undefined);

// Merges the reviewed resume data into the user's profile. Existing values are kept unless overwrite=true.
export const applyResumeData = asyncHandler(async (req, res) => {
  const { overwrite = false } = req.body;
  const incoming = sanitizeParsedProfile(req.body.profile);

  const user = await loadSeeker(req.user._id);
  let profile = user.jobSeekerProfile || new JobSeekerProfile({ name: user.name });

  const setScalar = (key, value) => {
    if (!value) return;
    if (overwrite || !profile[key]) profile[key] = value;
  };
  setScalar("bio", incoming.bio);
  setScalar("primaryRole", incoming.primaryRole);
  setScalar("contactNumber", incoming.contactNumber);
  setScalar("location", incoming.location);
  if (incoming.yearsOfExperience !== "0") setScalar("yearsOfExperience", incoming.yearsOfExperience);

  const skills = new Map((profile.skills || []).map((s) => [norm(s), s]));
  incoming.skills.forEach((s) => skills.has(norm(s)) || skills.set(norm(s), s));
  profile.skills = [...skills.values()];

  const knownEdu = new Set((profile.education || []).map((e) => `${norm(e.institution)}|${norm(e.degree)}`));
  for (const e of incoming.education) {
    if (!knownEdu.has(`${norm(e.institution)}|${norm(e.degree)}`)) profile.education.push(e);
  }

  const knownJobs = new Set((profile.workExperience || []).map((w) => `${norm(w.jobTitle)}|${norm(w.company?.name)}`));
  for (const w of incoming.workExperience) {
    if (knownJobs.has(`${norm(w.jobTitle)}|${norm(w.company?.name)}`)) continue;
    profile.workExperience.push({
      jobTitle: w.jobTitle,
      company: { name: w.company?.name || "" },
      startMonth: monthToDate(w.startMonth),
      endMonth: monthToDate(w.endMonth),
      currentJob: w.currentJob,
      description: w.description,
    });
  }

  const social = profile.socialProfiles || {};
  for (const key of ["linkedIn", "github", "portfolioWebsite"]) {
    const value = incoming.socialProfiles[key];
    if (value && (overwrite || !social[key])) social[key] = value;
  }
  profile.socialProfiles = social;

  await profile.save();

  // The app also reads a mirrored copy on the user document, so keep both in step
  const legacy = { ...(user.userProfile || {}) };
  Object.assign(legacy, {
    name: user.name,
    bio: profile.bio,
    primaryRole: profile.primaryRole,
    contactNumber: profile.contactNumber,
    location: profile.location,
    yearsOfExperience: profile.yearsOfExperience,
    skills: profile.skills,
    education: profile.education.map((e) => e.toObject()),
    workExperience: profile.workExperience.map((w) => w.toObject()),
    socialProfiles: profile.socialProfiles?.toObject?.() ?? profile.socialProfiles,
  });
  user.userProfile = legacy;
  user.markModified("userProfile");
  user.jobSeekerProfile = profile._id;
  await user.save({ validateBeforeSave: false });

  const updated = await User.findById(user._id).select("-password -refreshToken").populate("jobSeekerProfile");
  return res.status(200).json(new ApiResponse(200, { user: updated }, "Profile updated from your resume"));
});

// ---- Cover letter ---------------------------------------------------------------

export const createCoverLetter = asyncHandler(async (req, res) => {
  const { jobId, tone } = req.body;
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const user = await loadSeeker(req.user._id);
  const result = await generateCoverLetter({
    candidate: aiCandidate(user),
    job,
    companyName: await getCompanyName(job),
    tone,
  });

  return res.status(200).json(new ApiResponse(200, result, "Cover letter drafted"));
});

// ---- Interview preparation -------------------------------------------------------------

export const getInterviewPrep = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new ApiError(404, "Job not found");

  const user = await loadSeeker(req.user._id);
  const result = await generateInterviewPrep({
    candidate: aiCandidate(user),
    job,
    companyName: await getCompanyName(job),
  });

  return res.status(200).json(new ApiResponse(200, result, "Interview preparation ready"));
});
