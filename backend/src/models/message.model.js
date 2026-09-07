import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["chat_request", "application_update", "general"],
    default: "general"
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  relatedJob: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: false
  },
  relatedApplication: {
    type: Schema.Types.ObjectId,
    ref: "Application",
    required: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
messageSchema.index({ to: 1, createdAt: -1 });
messageSchema.index({ from: 1, createdAt: -1 });
messageSchema.index({ isRead: 1 });

export const Message = mongoose.model("Message", messageSchema);