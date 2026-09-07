import mongoose, { Schema } from "mongoose";

const applicationSchema = new Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      maxlength: 1000,
    },
    resume: {
      type: String, // URL to resume file
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "shortlisted", "rejected", "hired"],
      default: "pending",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String, // Internal notes by the employer
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Index for efficient queries
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ applicant: 1, createdAt: -1 });
applicationSchema.index({ status: 1 });

export const Application = mongoose.model("Application", applicationSchema);