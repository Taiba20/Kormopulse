import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import { User } from "../models/user.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { notify } from "../utils/notify.js";
import { sendShortlisted, sendHired, sendApplicationRejected } from "../utils/mail.service.js";

export const APPLICATION_STATUSES = ["pending", "reviewed", "shortlisted", "interview", "hired", "rejected"];

// Job.applicants (the older, embedded copy of each application) uses a different vocabulary
const JOB_APPLICANT_STATUS = {
  pending: "applied",
  reviewed: "reviewed",
  shortlisted: "interviewed",
  interview: "interviewed",
  hired: "hired",
  rejected: "rejected",
};

export const getCompanyName = async (job) => {
  const company = await CompanyProfile.findById(job.company).select("companyName");
  return company?.companyName || "the employer";
};

/** Loads a job and makes sure the given user is the employer who posted it. */
export const assertJobOwner = async (jobId, userId) => {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, "Job not found");
  if (job.postedBy.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only manage applications for your own job postings");
  }
  return job;
};

const messagesFor = (status, jobTitle, companyName) =>
  ({
    reviewed: {
      title: "Your application is being reviewed",
      message: `${companyName} has started reviewing your application for ${jobTitle}.`,
    },
    shortlisted: {
      title: "You have been shortlisted",
      message: `${companyName} shortlisted you for ${jobTitle}.`,
    },
    interview: {
      title: "You moved to the interview stage",
      message: `${companyName} moved your application for ${jobTitle} to the interview stage.`,
    },
    hired: {
      title: "Congratulations, you were selected!",
      message: `${companyName} selected you for ${jobTitle}.`,
    },
    rejected: {
      title: "Application update",
      message: `${companyName} decided not to move forward with your application for ${jobTitle}.`,
    },
  })[status];

/**
 * Single place where an application moves between pipeline stages. It keeps the
 * Application record, its audit trail, the legacy Job.applicants copy, the
 * candidate's in-app notification and the email notification in sync.
 */
export const changeApplicationStatus = async ({ application, job, status, actorId, note, silent = false }) => {
  if (!APPLICATION_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${APPLICATION_STATUSES.join(", ")}`);
  }

  const previous = application.status;
  if (previous === status) return application;

  application.status = status;
  application.reviewedAt = new Date();
  application.reviewedBy = actorId;
  application.statusHistory.push({ status, changedAt: new Date(), changedBy: actorId, note });
  await application.save();

  // Keep the legacy embedded copy on the job consistent
  const embedded = job.applicants.find((a) => a.user.toString() === application.applicant.toString());
  if (embedded) {
    embedded.status = JOB_APPLICANT_STATUS[status];
    await job.save();
  }

  if (!silent) {
    const [candidate, companyName] = await Promise.all([
      User.findById(application.applicant).select("name email"),
      getCompanyName(job),
    ]);
    const copy = messagesFor(status, job.title, companyName);
    if (copy && candidate) {
      void notify(candidate._id, {
        type: "application_status",
        title: copy.title,
        message: copy.message,
        link: "/jobseeker/applications",
        data: { applicationId: application._id, jobId: job._id, status },
      });
      const mailArgs = { to: candidate.email, name: candidate.name, jobTitle: job.title, companyName };
      if (status === "shortlisted") void sendShortlisted(mailArgs);
      if (status === "hired") void sendHired(mailArgs);
      if (status === "rejected") void sendApplicationRejected(mailArgs);
    }
  }

  return application;
};

export const findApplication = async (jobId, applicantId) => {
  const application = await Application.findOne({ job: jobId, applicant: applicantId });
  if (!application) throw new ApiError(404, "Application not found");
  return application;
};
