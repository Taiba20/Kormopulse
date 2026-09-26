import { JobAlert } from "../models/jobAlert.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendAlertDigest } from "../services/alert.service.js";

const MAX_ALERTS_PER_USER = 10;

export const listAlerts = asyncHandler(async (req, res) => {
  const alerts = await JobAlert.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { alerts }, "Alerts fetched"));
});

export const createAlert = asyncHandler(async (req, res) => {
  const count = await JobAlert.countDocuments({ user: req.user._id });
  if (count >= MAX_ALERTS_PER_USER) {
    throw new ApiError(400, `You can have at most ${MAX_ALERTS_PER_USER} job alerts. Delete one to add another.`);
  }
  const alert = await JobAlert.create({ ...req.body, user: req.user._id });
  return res.status(201).json(new ApiResponse(201, alert, "Job alert created"));
});

export const updateAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!alert) throw new ApiError(404, "Alert not found");
  return res.status(200).json(new ApiResponse(200, alert, "Job alert updated"));
});

export const deleteAlert = asyncHandler(async (req, res) => {
  const result = await JobAlert.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new ApiError(404, "Alert not found");
  return res.status(200).json(new ApiResponse(200, {}, "Job alert deleted"));
});

// Sends a digest right now covering the last 30 days, so users can preview an alert.
export const testAlert = asyncHandler(async (req, res) => {
  const alert = await JobAlert.findOne({ _id: req.params.id, user: req.user._id });
  if (!alert) throw new ApiError(404, "Alert not found");
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const count = await sendAlertDigest(alert, since);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { jobsFound: count },
        count ? `Sent ${count} matching job(s) to your email` : "No matching jobs in the last 30 days"
      )
    );
});
