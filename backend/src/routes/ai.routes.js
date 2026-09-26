import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { aiLimiter } from "../middlewares/rateLimit.middleware.js";
import { ApiError } from "../utils/ApiError.js";
import { RESUME_MAX_BYTES, isSupportedResume } from "../utils/resumeText.js";
import {
  parseResumeUpload,
  applyResumeData,
  createCoverLetter,
  getInterviewPrep,
} from "../controllers/ai.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("jobSeeker"), aiLimiter);

// Resumes are parsed in memory and never written to disk
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RESUME_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    isSupportedResume(file) ? cb(null, true) : cb(new ApiError(400, "Upload a PDF, DOCX or TXT resume")),
});

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// The profile payload is re-sanitised in the controller, so the schema only checks its overall shape
const applySchema = z.object({
  profile: z.record(z.string(), z.any()),
  overwrite: z.boolean().optional(),
});

router.post("/resume/parse", resumeUpload.single("resume"), parseResumeUpload);
router.post("/resume/apply", validate(applySchema), applyResumeData);
router.post(
  "/cover-letter",
  validate(
    z.object({
      jobId: objectId,
      tone: z.enum(["professional", "enthusiastic", "concise"]).default("professional"),
    })
  ),
  createCoverLetter
);
router.get("/interview-prep/:jobId", validate(z.object({ jobId: objectId }), "params"), getInterviewPrep);

export default router;
