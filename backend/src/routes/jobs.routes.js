import { Router } from "express";
import {
  ping,
  authPing,
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  postJob,
  sendJobDescription,
  applyForJob,
  saveJob,
  getSavedJobs,
  removeSavedJob,
  getJobLocations,
  getCompanies,
  getJobApplications,
  getMyApplications,
  getMyCompanyApplications,
  shortlistCandidate,
  removeFromShortlist,
  rejectCandidate,
  getJobApplicationsViaApplication,
  getJobRecommendations,
  hireCandidate,
  checkApplicationStatus,
} from "../controllers/job.controller.js";
import { verifyJWT, requireRole, requireVerifiedEmail } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { z } from "zod";
import { getMatchScores, getJobMatch } from "../controllers/application.controller.js";
import { getSalaryInsights, getPublicCompany } from "../controllers/insights.controller.js";

const router = Router();

// Public routes
router.route("/ping").get(ping);
router.route("/jobs").get(getJobs).post(verifyJWT, requireVerifiedEmail, createJob);
router.route("/jobs/:id").get(getJobById);
router.route("/job-locations").get(getJobLocations);
router.route("/companies").get(getCompanies);
router.route("/company/:id").get(validate(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") }), "params"), getPublicCompany);
router.route("/salary-insights").get(getSalaryInsights);

// Protected routes (require authentication)
router.route("/auth-ping").get(verifyJWT, authPing);

// Employer routes
router.route("/post-job").post(verifyJWT, requireVerifiedEmail, postJob); // Legacy route for compatibility
router.route("/my-jobs").get(verifyJWT, getMyJobs);
router.route("/my-company-applications").get(verifyJWT, getMyCompanyApplications);
router.route("/generate-job-description").post(verifyJWT, sendJobDescription);
router.route("/jobs/:id/applications").get(verifyJWT, getJobApplications);
router.route("/jobs/:id/applications-via-app").get(verifyJWT, getJobApplicationsViaApplication);
router.route("/shortlist-candidate").post(verifyJWT, shortlistCandidate);
router.route("/remove-from-shortlist").post(verifyJWT, removeFromShortlist);
router.route("/reject-candidate").post(verifyJWT, rejectCandidate);
router.route("/hire-candidate").post(verifyJWT, hireCandidate);

// Job seeker routes
router.route("/apply/:id").post(verifyJWT, requireVerifiedEmail, applyForJob);
router.route("/save/:id").post(verifyJWT, saveJob);
router.route("/remove-saved-job/:id").post(verifyJWT, removeSavedJob);
router.route("/saved-jobs").get(verifyJWT, getSavedJobs);
router.route("/my-applications").get(verifyJWT, getMyApplications);
router.route("/job-recommendations").get(verifyJWT, getJobRecommendations);
router.route("/application-status/:jobId").get(verifyJWT, checkApplicationStatus);

// Match scores (job seekers)
router.route("/match-scores").post(
  verifyJWT,
  requireRole("jobSeeker"),
  validate(z.object({ jobIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(50) })),
  getMatchScores
);
router.route("/match/:id").get(verifyJWT, requireRole("jobSeeker"), getJobMatch);

export default router;
