import mongoose, { Schema } from "mongoose";

const jobAlertSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, trim: true, maxlength: 80 },
    keyword: { type: String, trim: true, maxlength: 100, default: "" },
    location: { type: String, trim: true, maxlength: 100, default: "" },
    category: { type: String, default: "" },
    jobType: { type: String, default: "" },
    workMode: { type: String, default: "" },
    minSalary: { type: Number, min: 0, default: 0 },
    frequency: { type: String, enum: ["instant", "daily", "weekly"], default: "daily" },
    isActive: { type: Boolean, default: true },
    lastSentAt: Date,
    // Only jobs created after this moment are considered for the next digest
    lastCheckedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const JobAlert = mongoose.model("JobAlert", jobAlertSchema);
