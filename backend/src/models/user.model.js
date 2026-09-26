import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ["jobSeeker", "employer", "admin"] },
    refreshToken: String,
    // undefined (legacy accounts) counts as verified; new accounts start as false
    emailVerified: { type: Boolean },
    emailVerificationCodeHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    emailVerificationAttempts: { type: Number, default: 0, select: false },
    googleId: { type: String, index: true, sparse: true },
    isSuspended: { type: Boolean, default: false },
    suspendedReason: String,
    suspendedAt: Date,
    lastLoginAt: Date,
    // Password reset via emailed code (only a hash of the code is stored)
    passwordResetCodeHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    passwordResetAttempts: { type: Number, default: 0, select: false },
    // Keep userProfile for backward compatibility, but also add profile references
    userProfile: { type: Schema.Types.Mixed },
    jobSeekerProfile: { type: Schema.Types.ObjectId, ref: "JobSeekerProfile" },
    companyProfile: { type: Schema.Types.ObjectId, ref: "CompanyProfile" },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);