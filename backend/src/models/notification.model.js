import mongoose, { Schema } from "mongoose";

export const NOTIFICATION_TYPES = [
  "application_received",
  "application_status",
  "interview",
  "message",
  "job_alert",
  "review",
  "system",
];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "system" },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, default: "", maxlength: 500 },
    link: { type: String, default: "" }, // in-app path such as /interviews
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model("Notification", notificationSchema);
