import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listSavedSearches,
  createSavedSearch,
  renameSavedSearch,
  deleteSavedSearch,
} from "../controllers/savedSearch.controller.js";

const router = Router();
// Saved searches only make sense on the job-search page, which is a job seeker feature.
router.use(verifyJWT, requireRole("jobSeeker"));

const idParam = validate(z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id") }), "params");

const nameField = z.string({ error: "Name is required" }).trim().min(1, { error: "Name is required" }).max(80);

// `filters` mirrors whatever shape the job-search filter UI currently uses (search keyword,
// location, jobTypes, workMode, salaryRange, experience, datePosted, company); it is stored and
// replayed as-is rather than validated field-by-field, so it isn't tightly coupled to that shape.
const createSchema = z.object({
  name: nameField,
  filters: z.record(z.string(), z.any()).optional(),
});

const renameSchema = z.object({ name: nameField });

router.get("/", listSavedSearches);
router.post("/", validate(createSchema), createSavedSearch);
router.patch("/:id", idParam, validate(renameSchema), renameSavedSearch);
router.delete("/:id", idParam, deleteSavedSearch);

export default router;
