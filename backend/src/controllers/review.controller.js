import mongoose from "mongoose";
import { CompanyReview } from "../models/companyReview.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notify } from "../utils/notify.js";

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

/** Rating summary for one company (or, with no id, for every company at once). */
export const summarizeRatings = async (companyIds) => {
  const match = companyIds ? { company: { $in: companyIds.map(toObjectId) } } : {};
  const rows = await CompanyReview.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$company",
        average: { $avg: "$rating" },
        count: { $sum: 1 },
        recommended: { $sum: { $cond: ["$recommend", 1, 0] } },
        r1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        r2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
        r3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
        r4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
        r5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
      },
    },
  ]);
  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        average: Math.round(row.average * 10) / 10,
        count: row.count,
        recommendPercent: Math.round((row.recommended / row.count) * 100),
        distribution: { 1: row.r1, 2: row.r2, 3: row.r3, 4: row.r4, 5: row.r5 },
      },
    ])
  );
};

const emptySummary = { average: 0, count: 0, recommendPercent: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

const publicReview = (review, viewerId) => {
  const obj = review.toObject();
  const author = obj.user;
  const isMine = viewerId && String(author?._id || author) === String(viewerId);
  return {
    _id: obj._id,
    rating: obj.rating,
    title: obj.title,
    pros: obj.pros,
    cons: obj.cons,
    jobTitle: obj.jobTitle,
    employmentStatus: obj.employmentStatus,
    recommend: obj.recommend,
    isAnonymous: obj.isAnonymous,
    author: obj.isAnonymous ? "Anonymous" : author?.name || "Former user",
    isMine: Boolean(isMine),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
};

const SORTS = {
  recent: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

export const listCompanyReviews = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { page = 1, limit = 10, sort = "recent" } = req.query;

  const company = await CompanyProfile.findById(companyId).select("companyName companyLogo industry");
  if (!company) throw new ApiError(404, "Company not found");

  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));

  const [reviews, summaries] = await Promise.all([
    CompanyReview.find({ company: companyId })
      .populate("user", "name")
      .sort(SORTS[sort] || SORTS.recent)
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber),
    summarizeRatings([companyId]),
  ]);
  const summary = summaries.get(String(companyId)) || emptySummary;

  // Let a logged-in viewer see which review is theirs (auth is optional on this route)
  const viewerId = req.user?._id;
  const mine = viewerId ? await CompanyReview.findOne({ company: companyId, user: viewerId }) : null;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        company,
        summary,
        reviews: reviews.map((r) => publicReview(r, viewerId)),
        myReview: mine
          ? {
              _id: mine._id,
              rating: mine.rating,
              title: mine.title,
              pros: mine.pros,
              cons: mine.cons,
              jobTitle: mine.jobTitle,
              employmentStatus: mine.employmentStatus,
              recommend: mine.recommend,
              isAnonymous: mine.isAnonymous,
            }
          : null,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total: summary.count,
          totalPages: Math.ceil(summary.count / limitNumber) || 1,
        },
      },
      "Reviews fetched"
    )
  );
});

export const createCompanyReview = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const company = await CompanyProfile.findById(companyId).select("companyName");
  if (!company) throw new ApiError(404, "Company not found");

  // Employers cannot review their own company
  const owner = await User.findOne({ companyProfile: companyId }).select("_id");
  if (owner && String(owner._id) === String(req.user._id)) {
    throw new ApiError(403, "You cannot review your own company");
  }

  try {
    const review = await CompanyReview.create({ ...req.body, company: companyId, user: req.user._id });
    if (owner) {
      void notify(owner._id, {
        type: "review",
        title: "New company review",
        message: `Your company received a ${review.rating}-star review: "${review.title}"`,
        link: `/companies/${companyId}`,
        data: { companyId },
      });
    }
    return res.status(201).json(new ApiResponse(201, review, "Thanks for sharing your experience"));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "You have already reviewed this company. Edit your existing review instead.");
    }
    throw error;
  }
});

export const updateReview = asyncHandler(async (req, res) => {
  const review = await CompanyReview.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!review) throw new ApiError(404, "Review not found");
  return res.status(200).json(new ApiResponse(200, review, "Review updated"));
});

export const deleteReview = asyncHandler(async (req, res) => {
  const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const result = await CompanyReview.deleteOne(filter);
  if (!result.deletedCount) throw new ApiError(404, "Review not found");
  return res.status(200).json(new ApiResponse(200, {}, "Review deleted"));
});
