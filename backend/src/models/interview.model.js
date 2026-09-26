import mongoose, { Schema } from "mongoose";

export const INTERVIEW_STATUSES = ["proposed", "confirmed", "declined", "cancelled", "completed"];
export const INTERVIEW_MODES = ["online", "onsite", "phone"];

const interviewSchema = new Schema(
  {
    application: { type: Schema.Types.ObjectId, ref: "Application", required: true },
    job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
    employer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    candidate: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slots: {
      type: [Date],
      validate: [(v) => v.length >= 1 && v.length <= 5, "Provide between 1 and 5 time slots"],
    },
    selectedSlot: Date,
    durationMinutes: { type: Number, default: 30, min: 10, max: 480 },
    mode: { type: String, enum: INTERVIEW_MODES, default: "online" },
    meetingLink: { type: String, maxlength: 500 },
    location: { type: String, maxlength: 300 },
    notes: { type: String, maxlength: 1000 },
    status: { type: String, enum: INTERVIEW_STATUSES, default: "proposed" },
    declineReason: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

interviewSchema.index({ candidate: 1, status: 1, createdAt: -1 });
interviewSchema.index({ employer: 1, status: 1, createdAt: -1 });
interviewSchema.index({ application: 1 });

export const Interview = mongoose.model("Interview", interviewSchema);
