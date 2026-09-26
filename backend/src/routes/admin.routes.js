import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getPlatformStats,
  listUsers,
  setUserSuspension,
  deleteUser,
  listAllJobs,
  setJobStatus,
  deleteJob,
  listAllReviews,
  triggerJobAlerts,
} from "../controllers/admin.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("admin"));

const idParam = validate(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") }), "params");

router.get("/stats", getPlatformStats);

router.get("/users", listUsers);
router.patch(
  "/users/:id/suspend",
  idParam,
  validate(z.object({ suspended: z.boolean(), reason: z.string().trim().max(300).optional() })),
  setUserSuspension
);
router.delete("/users/:id", idParam, deleteUser);

router.get("/jobs", listAllJobs);
router.patch("/jobs/:id/status", idParam, validate(z.object({ isActive: z.boolean() })), setJobStatus);
router.delete("/jobs/:id", idParam, deleteJob);

router.get("/reviews", listAllReviews);
router.post("/run-job-alerts", triggerJobAlerts);

export default router;
