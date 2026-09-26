import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { listAlerts, createAlert, updateAlert, deleteAlert, testAlert } from "../controllers/alert.controller.js";

const router = Router();
router.use(verifyJWT, requireRole("jobSeeker"));

const idParam = validate(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") }), "params");

const fields = {
  name: z.string().trim().max(80),
  keyword: z.string().trim().max(100),
  location: z.string().trim().max(100),
  category: z.string().trim().max(50),
  jobType: z.enum(["", "full-time", "part-time", "internship", "freelance", "contract"]),
  workMode: z.enum(["", "remote", "onsite", "hybrid"]),
  minSalary: z.coerce.number().min(0),
  frequency: z.enum(["instant", "daily", "weekly"]),
  isActive: z.boolean(),
};

const createSchema = z
  .object({
    name: fields.name.optional(),
    keyword: fields.keyword.optional(),
    location: fields.location.optional(),
    category: fields.category.optional(),
    jobType: fields.jobType.optional(),
    workMode: fields.workMode.optional(),
    minSalary: fields.minSalary.optional(),
    frequency: fields.frequency.default("daily"),
  })
  .refine((v) => v.keyword || v.location || v.category || v.jobType || v.workMode || v.minSalary, {
    error: "Add at least one search criterion (keyword, location, category, type, mode or salary)",
  });

const updateSchema = z.object(Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()])));

router.get("/", listAlerts);
router.post("/", validate(createSchema), createAlert);
router.patch("/:id", idParam, validate(updateSchema), updateAlert);
router.delete("/:id", idParam, deleteAlert);
router.post("/:id/test", idParam, testAlert);

export default router;
