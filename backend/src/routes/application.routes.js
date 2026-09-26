import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getJobPipeline,
  updateApplicationStatus,
  getMyApplicationsDetailed,
} from "../controllers/application.controller.js";
import { APPLICATION_STATUSES } from "../services/application.service.js";

const router = Router();
router.use(verifyJWT);

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

router.get("/mine", requireRole("jobSeeker"), getMyApplicationsDetailed);
router.get(
  "/pipeline/:jobId",
  requireRole("employer"),
  validate(z.object({ jobId: objectId }), "params"),
  getJobPipeline
);
router.patch(
  "/:id/status",
  requireRole("employer"),
  validate(z.object({ id: objectId }), "params"),
  validate(
    z.object({
      status: z.enum(APPLICATION_STATUSES, { error: `Status must be one of: ${APPLICATION_STATUSES.join(", ")}` }),
      note: z.string().trim().max(500).optional(),
    })
  ),
  updateApplicationStatus
);

export default router;
