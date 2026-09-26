import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole, requireVerifiedEmail } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { INTERVIEW_MODES } from "../models/interview.model.js";
import {
  proposeInterview,
  listMyInterviews,
  confirmInterview,
  declineInterview,
  cancelInterview,
  completeInterview,
  downloadInterviewIcs,
} from "../controllers/interview.controller.js";

const router = Router();
router.use(verifyJWT);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const idParam = validate(z.object({ id: objectId }), "params");

const proposeSchema = z
  .object({
    applicationId: objectId,
    slots: z
      .array(z.coerce.date({ error: "Each slot must be a valid date and time" }))
      .min(1, "Offer at least one time slot")
      .max(5, "Offer at most 5 time slots"),
    durationMinutes: z.coerce.number().int().min(10).max(480).default(30),
    mode: z.enum(INTERVIEW_MODES).default("online"),
    meetingLink: z.string().trim().url("Meeting link must be a valid URL").max(500).optional().or(z.literal("")),
    location: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    const now = Date.now();
    value.slots.forEach((slot, i) => {
      if (slot.getTime() <= now) {
        ctx.addIssue({ code: "custom", path: ["slots", i], message: "Time slots must be in the future" });
      }
    });
    if (new Set(value.slots.map((s) => s.getTime())).size !== value.slots.length) {
      ctx.addIssue({ code: "custom", path: ["slots"], message: "Time slots must be different" });
    }
    if (value.mode === "online" && !value.meetingLink) {
      ctx.addIssue({ code: "custom", path: ["meetingLink"], message: "Add a meeting link for online interviews" });
    }
    if (value.mode === "onsite" && !value.location) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Add a location for onsite interviews" });
    }
  });

router.get("/mine", listMyInterviews);
router.post("/", requireRole("employer"), requireVerifiedEmail, validate(proposeSchema), proposeInterview);
router.post(
  "/:id/confirm",
  requireRole("jobSeeker"),
  idParam,
  validate(z.object({ slotIndex: z.coerce.number().int().min(0).max(4) })),
  confirmInterview
);
router.post(
  "/:id/decline",
  requireRole("jobSeeker"),
  idParam,
  validate(z.object({ reason: z.string().trim().max(500).optional() })),
  declineInterview
);
router.post("/:id/cancel", requireRole("employer"), idParam, cancelInterview);
router.post("/:id/complete", requireRole("employer"), idParam, completeInterview);
router.get("/:id/ics", idParam, downloadInterviewIcs);

export default router;
