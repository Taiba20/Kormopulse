import mongoose, { Schema } from "mongoose";

const jobSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 }, // Made optional
    responsibilities: [String],
    requirements: [String],
    skills: [String],
    education: String,
    experience: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    salary: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
      currency: { type: String, default: "BDT" },
      negotiable: { type: Boolean, default: false },
    },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "freelance", "contract"],
      required: true,
    },
    workMode: {
      type: String,
      enum: ["remote", "onsite", "hybrid"],
      required: true,
    },
    location: { type: String, required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CompanyProfile",
      required: true,
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    applicants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      appliedAt: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["applied", "reviewed", "interviewed", "rejected", "hired"],
        default: "applied",
      },
      coverLetter: String,
    }],
    shortlistedCandidates: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ],
    benefits: [String],
    applicationDeadline: { type: Date, required: true },
    additionalRequirements: [String], // Changed to array to match frontend
    urgent: { type: Boolean, default: false },
    numberOfOpenings: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    applicationCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    category: {
      type: String,
      default: "technology", // Changed default to technology
      enum: [
        "technology",
        "software-development",
        "data-science",
        "design",
        "marketing",
        "sales",
        "finance",
        "human-resources",
        "operations",
        "customer-service",
        "healthcare",
        "education",
        "engineering",
        "consulting",
        "other"
      ],
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
jobSchema.index({ title: "text", description: "text", skills: "text" });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ category: 1 });
jobSchema.index({ isActive: 1 });
jobSchema.index({ createdAt: -1 });

// Virtual for calculating days since posted
jobSchema.virtual('daysPosted').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

export const Job = mongoose.model("Job", jobSchema);
