import mongoose, { Schema } from "mongoose";

const companyReviewSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: "CompanyProfile", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    pros: { type: String, trim: true, maxlength: 1000, default: "" },
    cons: { type: String, trim: true, maxlength: 1000, default: "" },
    jobTitle: { type: String, trim: true, maxlength: 100, default: "" },
    employmentStatus: {
      type: String,
      enum: ["current", "former", "interviewee"],
      default: "former",
    },
    recommend: { type: Boolean, default: true },
    isAnonymous: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// One review per person per company
companyReviewSchema.index({ company: 1, user: 1 }, { unique: true });

export const CompanyReview = mongoose.model("CompanyReview", companyReviewSchema);
