import { SavedSearch } from "../models/savedSearch.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_SAVED_SEARCHES_PER_USER = 20;

export const listSavedSearches = asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, { searches }, "Saved searches fetched"));
});

export const createSavedSearch = asyncHandler(async (req, res) => {
  const count = await SavedSearch.countDocuments({ user: req.user._id });
  if (count >= MAX_SAVED_SEARCHES_PER_USER) {
    throw new ApiError(400, `You can have at most ${MAX_SAVED_SEARCHES_PER_USER} saved searches. Delete one to add another.`);
  }
  const search = await SavedSearch.create({ user: req.user._id, name: req.body.name, filters: req.body.filters || {} });
  return res.status(201).json(new ApiResponse(201, search, "Search saved"));
});

export const renameSavedSearch = asyncHandler(async (req, res) => {
  const search = await SavedSearch.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  if (!search) throw new ApiError(404, "Saved search not found");
  return res.status(200).json(new ApiResponse(200, search, "Saved search renamed"));
});

export const deleteSavedSearch = asyncHandler(async (req, res) => {
  const result = await SavedSearch.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new ApiError(404, "Saved search not found");
  return res.status(200).json(new ApiResponse(200, {}, "Saved search deleted"));
});
