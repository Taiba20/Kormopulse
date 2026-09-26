import { Notification } from "../models/notification.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, unreadOnly } = req.validated?.query ?? {};
  const filter = { user: req.user._id };
  if (unreadOnly) filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications: items,
        unreadCount,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
      },
      "Notifications fetched"
    )
  );
});

export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return res.status(200).json(new ApiResponse(200, { unreadCount }, "Unread count fetched"));
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, notification, "Notification marked as read"));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, { modifiedCount: result.modifiedCount }, "All notifications marked as read"));
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new ApiError(404, "Notification not found");
  return res.status(200).json(new ApiResponse(200, {}, "Notification deleted"));
});
