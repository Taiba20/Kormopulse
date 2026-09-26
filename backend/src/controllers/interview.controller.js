import { Interview } from "../models/interview.model.js";
import { Application } from "../models/application.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";
import { buildIcs } from "../utils/ics.js";
import {
  sendInterviewProposed,
  sendInterviewConfirmed,
  sendInterviewCancelled,
  sendInterviewDeclined,
} from "../utils/mail.service.js";
import {
  assertJobOwner,
  changeApplicationStatus,
  getCompanyName,
} from "../services/application.service.js";

const populate = (query) =>
  query
    .populate("job", "title location company")
    .populate("employer", "name email")
    .populate("candidate", "name email");

const loadForParticipant = async (id, userId) => {
  const interview = await populate(Interview.findById(id));
  if (!interview) throw new ApiError(404, "Interview not found");
  const isParticipant = [interview.employer._id, interview.candidate._id].some((u) => u.equals(userId));
  if (!isParticipant) throw new ApiError(403, "You are not part of this interview");
  return interview;
};

const parties = (interview) => ({
  organizer: { name: interview.employer.name, email: interview.employer.email },
  attendee: { name: interview.candidate.name, email: interview.candidate.email },
});

// Employer: offer 1-5 time slots for an application
export const proposeInterview = asyncHandler(async (req, res) => {
  const { applicationId, slots, durationMinutes, mode, meetingLink, location, notes } = req.body;

  const application = await Application.findById(applicationId);
  if (!application) throw new ApiError(404, "Application not found");
  const job = await assertJobOwner(application.job, req.user._id);

  const active = await Interview.findOne({ application: application._id, status: { $in: ["proposed", "confirmed"] } });
  if (active?.status === "confirmed") {
    throw new ApiError(409, "An interview is already confirmed for this application. Cancel it before scheduling a new one.");
  }
  if (active) {
    active.status = "cancelled"; // superseded by the new proposal
    await active.save();
  }

  const interview = await Interview.create({
    application: application._id,
    job: job._id,
    employer: req.user._id,
    candidate: application.applicant,
    slots,
    durationMinutes,
    mode,
    meetingLink,
    location,
    notes,
  });

  await changeApplicationStatus({
    application,
    job,
    status: "interview",
    actorId: req.user._id,
    note: "Interview invitation sent",
    silent: true, // the interview invitation below is the notification
  });

  const [candidate, companyName] = await Promise.all([
    User.findById(application.applicant).select("name email"),
    getCompanyName(job),
  ]);

  void notify(candidate._id, {
    type: "interview",
    title: `Interview invitation from ${companyName}`,
    message: `Choose a time for your ${job.title} interview.`,
    link: "/interviews",
    data: { interviewId: interview._id, jobId: job._id },
  });
  void sendInterviewProposed({
    to: candidate.email,
    name: candidate.name,
    jobTitle: job.title,
    companyName,
    interview,
  });

  return res.status(201).json(new ApiResponse(201, await populate(Interview.findById(interview._id)), "Interview proposed"));
});

export const listMyInterviews = asyncHandler(async (req, res) => {
  const field = req.user.role === "employer" ? "employer" : "candidate";
  const interviews = await populate(Interview.find({ [field]: req.user._id }))
    .populate({ path: "job", select: "title location company", populate: { path: "company", select: "companyName" } })
    .sort({ createdAt: -1 });

  const now = Date.now();
  const data = interviews.map((interview) => {
    const obj = interview.toObject();
    const when = obj.selectedSlot || obj.slots?.[0];
    obj.isUpcoming = obj.status === "confirmed" && when && new Date(when).getTime() > now;
    return obj;
  });

  return res.status(200).json(new ApiResponse(200, { interviews: data }, "Interviews fetched"));
});

// Candidate: choose one of the offered slots
export const confirmInterview = asyncHandler(async (req, res) => {
  const interview = await loadForParticipant(req.params.id, req.user._id);
  if (!interview.candidate._id.equals(req.user._id)) throw new ApiError(403, "Only the candidate can confirm");
  if (interview.status !== "proposed") throw new ApiError(409, `This interview is already ${interview.status}`);

  const slot = interview.slots[req.body.slotIndex];
  if (!slot) throw new ApiError(400, "Choose one of the offered time slots");
  if (new Date(slot).getTime() < Date.now()) throw new ApiError(400, "That time slot has already passed");

  interview.selectedSlot = slot;
  interview.status = "confirmed";
  await interview.save();

  const companyName = await getCompanyName(interview.job);
  const { organizer, attendee } = parties(interview);
  const common = { jobTitle: interview.job.title, companyName, interview, organizer, attendee };

  void notify(interview.employer._id, {
    type: "interview",
    title: `${interview.candidate.name} confirmed the interview`,
    message: `${interview.job.title}: ${new Date(slot).toUTCString()}`,
    link: "/interviews",
    data: { interviewId: interview._id },
  });
  void sendInterviewConfirmed({ ...common, to: interview.candidate.email, name: interview.candidate.name, otherName: interview.employer.name });
  void sendInterviewConfirmed({ ...common, to: interview.employer.email, name: interview.employer.name, otherName: interview.candidate.name });

  return res.status(200).json(new ApiResponse(200, interview, "Interview confirmed"));
});

// Candidate: none of the slots work
export const declineInterview = asyncHandler(async (req, res) => {
  const interview = await loadForParticipant(req.params.id, req.user._id);
  if (!interview.candidate._id.equals(req.user._id)) throw new ApiError(403, "Only the candidate can decline");
  if (interview.status !== "proposed") throw new ApiError(409, `This interview is already ${interview.status}`);

  interview.status = "declined";
  interview.declineReason = req.body.reason;
  await interview.save();

  void notify(interview.employer._id, {
    type: "interview",
    title: `${interview.candidate.name} can't make the proposed times`,
    message: req.body.reason || "Propose new times from the interviews page.",
    link: "/interviews",
    data: { interviewId: interview._id },
  });
  void sendInterviewDeclined({
    to: interview.employer.email,
    employerName: interview.employer.name,
    candidateName: interview.candidate.name,
    jobTitle: interview.job.title,
    reason: req.body.reason,
  });

  return res.status(200).json(new ApiResponse(200, interview, "Interview declined"));
});

// Employer: cancel a proposed or confirmed interview
export const cancelInterview = asyncHandler(async (req, res) => {
  const interview = await loadForParticipant(req.params.id, req.user._id);
  if (!interview.employer._id.equals(req.user._id)) throw new ApiError(403, "Only the employer can cancel");
  if (!["proposed", "confirmed"].includes(interview.status)) {
    throw new ApiError(409, `This interview is already ${interview.status}`);
  }

  const wasConfirmed = interview.status === "confirmed";
  interview.status = "cancelled";
  await interview.save();

  const companyName = await getCompanyName(interview.job);
  const { organizer, attendee } = parties(interview);

  void notify(interview.candidate._id, {
    type: "interview",
    title: "Interview cancelled",
    message: `${companyName} cancelled the ${interview.job.title} interview.`,
    link: "/interviews",
    data: { interviewId: interview._id },
  });
  void sendInterviewCancelled({
    to: interview.candidate.email,
    name: interview.candidate.name,
    jobTitle: interview.job.title,
    companyName,
    interview: wasConfirmed ? interview : { ...interview.toObject(), selectedSlot: undefined },
    organizer,
    attendee,
  });

  return res.status(200).json(new ApiResponse(200, interview, "Interview cancelled"));
});

// Employer: mark a finished interview as completed
export const completeInterview = asyncHandler(async (req, res) => {
  const interview = await loadForParticipant(req.params.id, req.user._id);
  if (!interview.employer._id.equals(req.user._id)) throw new ApiError(403, "Only the employer can complete");
  if (interview.status !== "confirmed") throw new ApiError(409, "Only confirmed interviews can be completed");

  interview.status = "completed";
  await interview.save();
  return res.status(200).json(new ApiResponse(200, interview, "Interview marked as completed"));
});

// Either party: download the calendar file for a confirmed interview
export const downloadInterviewIcs = asyncHandler(async (req, res) => {
  const interview = await loadForParticipant(req.params.id, req.user._id);
  if (interview.status !== "confirmed" || !interview.selectedSlot) {
    throw new ApiError(409, "Only confirmed interviews have a calendar file");
  }
  const companyName = await getCompanyName(interview.job);
  const { organizer, attendee } = parties(interview);
  const ics = buildIcs({
    uid: String(interview._id),
    start: interview.selectedSlot,
    durationMinutes: interview.durationMinutes,
    title: `Interview: ${interview.job.title} (${companyName})`,
    description: interview.notes,
    location: interview.location || interview.meetingLink || "",
    url: interview.meetingLink || undefined,
    organizer,
    attendees: [attendee],
  });
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="interview.ics"');
  return res.status(200).send(ics);
});
