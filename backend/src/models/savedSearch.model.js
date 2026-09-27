import mongoose, { Schema } from "mongoose";

// The frontend's job filter shape (search, location, jobTypes[], workMode[], salaryRange{from,to},
// experience, datePosted, company) is stored as-is rather than mirrored field-by-field here, so a
// saved search always replays with exactly the filters the user had when they saved it, even as
// the filter UI evolves.
const savedSearchSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, trim: true, maxlength: 80, required: true },
    filters: { type: Schema.Types.Mixed, default: {} },
  },
  // minimize: false keeps an empty `filters: {}` (an intentional "match everything" search) as an
  // object instead of Mongoose's default of stripping empty Mixed fields down to undefined.
  { timestamps: true, minimize: false }
);

export const SavedSearch = mongoose.model("SavedSearch", savedSearchSchema);
