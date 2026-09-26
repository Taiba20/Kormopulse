import { Job } from "../models/job.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { ApiError } from "../utils/ApiError.js";
import { summarizeRatings } from "./review.controller.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const round = (n) => Math.round(n);

/** Linear-interpolated percentile of an ascending-sorted numeric array. */
export const percentile = (sorted, p) => {
  if (!sorted.length) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

const summarize = (rows) => {
  const mids = rows.map((r) => (r.min + r.max) / 2).sort((a, b) => a - b);
  const avg = (key) => (rows.length ? rows.reduce((sum, r) => sum + r[key], 0) / rows.length : 0);
  return {
    count: rows.length,
    avgMin: round(avg("min")),
    avgMax: round(avg("max")),
    p25: round(percentile(mids, 0.25)),
    median: round(percentile(mids, 0.5)),
    p75: round(percentile(mids, 0.75)),
  };
};

const groupBy = (rows, keyFn, { top = 10, minCount = 1 } = {}) => {
  const groups = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length >= minCount)
    .map(([key, list]) => ({ key, ...summarize(list) }))
    .sort((a, b) => b.count - a.count || b.median - a.median)
    .slice(0, top);
};

const experienceBand = (years) => {
  if (years < 1) return "0-1 yrs";
  if (years < 3) return "1-3 yrs";
  if (years < 5) return "3-5 yrs";
  return "5+ yrs";
};
const BAND_ORDER = ["0-1 yrs", "1-3 yrs", "3-5 yrs", "5+ yrs"];

// Public: salary statistics aggregated from the salary ranges employers publish on Kormopulse
export const getSalaryInsights = asyncHandler(async (req, res) => {
  const { title, category, location, jobType, workMode, currency = "BDT" } = req.query;

  const filter = { "salary.max": { $gt: 0 } };
  if (currency !== "any") filter["salary.currency"] = currency;
  if (title) filter.title = new RegExp(escapeRegex(title), "i");
  if (category) filter.category = category;
  if (location) filter.location = new RegExp(escapeRegex(location), "i");
  if (jobType) filter.jobType = jobType;
  if (workMode) filter.workMode = workMode;

  const jobs = await Job.find(filter)
    .select("title category location jobType experience salary")
    .limit(5000)
    .lean();

  const rows = jobs.map((job) => ({
    title: String(job.title || "").trim().toLowerCase(),
    category: job.category,
    location: String(job.location || "").split(",")[0].trim(),
    jobType: job.jobType,
    band: experienceBand(Number(job.experience?.min) || 0),
    min: Number(job.salary.min) || 0,
    max: Number(job.salary.max) || 0,
  }));

  const bandRows = groupBy(rows, (r) => r.band, { top: 4 }).sort(
    (a, b) => BAND_ORDER.indexOf(a.key) - BAND_ORDER.indexOf(b.key)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        currency: currency === "any" ? "mixed" : currency,
        sampleSize: rows.length,
        overall: summarize(rows),
        byCategory: groupBy(rows, (r) => r.category, { top: 8 }),
        byExperience: bandRows,
        byLocation: groupBy(rows, (r) => r.location, { top: 8 }),
        byJobType: groupBy(rows, (r) => r.jobType, { top: 5 }),
        topTitles: groupBy(rows, (r) => r.title, { top: 10 }),
        note: "Based on salary ranges published in job listings, not on individual pay slips.",
      },
      "Salary insights computed"
    )
  );
});

// Public company page: profile, open positions and rating summary
export const getPublicCompany = asyncHandler(async (req, res) => {
  const company = await CompanyProfile.findById(req.params.id).select(
    "companyName companyLogo companyDescription industry companySize companyWebsite address companySocialProfiles employeeBenefits"
  );
  if (!company) throw new ApiError(404, "Company not found");

  const [jobs, ratings] = await Promise.all([
    Job.find({ company: company._id, isActive: true })
      .select("title location jobType workMode salary createdAt")
      .sort({ createdAt: -1 })
      .limit(20),
    summarizeRatings([company._id]),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        company,
        jobs,
        rating: ratings.get(String(company._id)) || { average: 0, count: 0, recommendPercent: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      },
      "Company fetched"
    )
  );
});
