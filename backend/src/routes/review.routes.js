import { Router } from "express";
import { z } from "zod";
import { verifyJWT, requireRole } from "../middlewares/auth.middleware.js";
import { optionalAuth } from "../middlewares/optionalAuth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  listCompanyReviews,
  createCompanyReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = Router();

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const reviewFields = {
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5").max(5, "Choose a rating from 1 to 5"),
  title: z.string().trim().min(3, "Add a short headline").max(120),
  pros: z.string().trim().max(1000),
  cons: z.string().trim().max(1000),
  jobTitle: z.string().trim().max(100),
  employmentStatus: z.enum(["current", "former", "interviewee"]),
  recommend: z.boolean(),
  isAnonymous: z.boolean(),
};

const createSchema = z.object({
  rating: reviewFields.rating,
  title: reviewFields.title,
  pros: reviewFields.pros.optional(),
  cons: reviewFields.cons.optional(),
  jobTitle: reviewFields.jobTitle.optional(),
  employmentStatus: reviewFields.employmentStatus.optional(),
  recommend: reviewFields.recommend.optional(),
  isAnonymous: reviewFields.isAnonymous.optional(),
});
const updateSchema = z.object(Object.fromEntries(Object.entries(reviewFields).map(([k, v]) => [k, v.optional()])));

const companyParam = validate(z.object({ companyId: objectId }), "params");
const idParam = validate(z.object({ id: objectId }), "params");

// Reading reviews is public; the viewer is identified when logged in so "my review" can be flagged
router.get("/company/:companyId", companyParam, optionalAuth, listCompanyReviews);
router.post("/company/:companyId", verifyJWT, requireRole("jobSeeker"), companyParam, validate(createSchema), createCompanyReview);
router.put("/:id", verifyJWT, requireRole("jobSeeker"), idParam, validate(updateSchema), updateReview);
router.delete("/:id", verifyJWT, idParam, deleteReview);

export default router;
