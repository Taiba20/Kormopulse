import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { JobSeekerProfile } from "../models/jobSeekerProfile.model.js";
import { CompanyProfile } from "../models/companyProfile.model.js";
import { Job } from "../models/job.model.js";
import { Application } from "../models/application.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.service.js";
import { analyzeSkillGaps as analyzeSkillGapsAI } from "../utils/groqAi.service.js";
import { sendPasswordResetCode, sendEmailVerificationCode } from "../utils/mail.service.js";
import { notify } from "../utils/notify.js";
import { verifyGoogleCredential } from "../utils/google.service.js";
import {
  OTP_TTL_MINUTES,
  OTP_MAX_ATTEMPTS,
  generateOtp,
  hashOtp,
  otpMatches,
  otpExpiry,
  isInResendCooldown,
} from "../utils/otp.js";
import crypto from "crypto";
import {
  generateTwoFactorSecret,
  twoFactorOtpauthUrl,
  twoFactorQrCodeDataUrl,
  verifyTwoFactorToken,
  generateBackupCodes,
  consumeBackupCode,
  signPendingTwoFactorToken,
  readPendingTwoFactorToken,
} from "../utils/twoFactor.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 1000 * 60 * 60 * 24 * 7,
  // Optional: set COOKIE_DOMAIN (e.g. ".example.com") to share cookies across subdomains.
  // Left unset, the cookie is bound to the API's own host, which is the safe default.
  domain: process.env.COOKIE_DOMAIN || undefined,
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      `Something went wrong while generating referesh and access token: ${error}`
    );
  }
};

// Issues a fresh email-verification code and emails it (mail failures are only logged).
const issueEmailVerification = async (user) => {
  const code = generateOtp();
  user.emailVerificationCodeHash = hashOtp(user._id, code, "verify-email");
  user.emailVerificationExpires = otpExpiry();
  user.emailVerificationAttempts = 0;
  await user.save({ validateBeforeSave: false });
  return sendVerificationEmail(user, code);
};

const sendVerificationEmail = (user, code) =>
  sendEmailVerificationCode({
    to: user.email,
    name: user.name,
    code,
    expiresInMinutes: OTP_TTL_MINUTES,
    lang: user.language,
  });

const setAuthCookies = (res, accessToken, refreshToken) =>
  res
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions);

/** Issues real session tokens and the success response, shared by every path that finishes a login. */
const completeLogin = async (res, user, message) => {
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return setAuthCookies(res.status(200), accessToken, refreshToken).json(
    new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, message)
  );
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, language } = req.body; // validated by zod: role is jobSeeker | employer

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const username = email.split("@")[0];
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    password,
    role,
    language,
    emailVerified: false,
  });

  issueEmailVerification(user).catch((error) =>
    console.error("[verify-email] could not issue code:", error.message)
  );

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(createdUser._id);

  return setAuthCookies(res.status(201), accessToken, refreshToken).json(
    new ApiResponse(201, { user: createdUser, accessToken, refreshToken }, "User registered successfully")
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  if (user.isSuspended) {
    throw new ApiError(403, "Your account has been suspended. Contact support for help.");
  }

  if (user.twoFactorEnabled) {
    // The password is correct, but the session isn't granted yet: the client must redeem this
    // token with a code from their authenticator app at /users/2fa/login-verify.
    return res.status(200).json(
      new ApiResponse(200, { twoFactorRequired: true, twoFactorToken: signPendingTwoFactorToken(user._id) }, "Enter your two-factor code")
    );
  }

  return completeLogin(res, user, "User login successful");
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password -refreshToken");

  // Populate profiles if they exist
  if (user.jobSeekerProfile) {
    await user.populate('jobSeekerProfile');
  }
  if (user.companyProfile) {
    await user.populate('companyProfile');
  }

  return res.status(200).json(new ApiResponse(200, { user }, "Current user fetched successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const updateData = req.body;

  console.log('Update user profile request for userId:', userId);
  console.log('Request body:', JSON.stringify(updateData, null, 2));

  // Get the user to check their role
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  console.log('User role:', user.role);

  let profileId = null;

  // Create appropriate profile document based on user role
  if (user.role === "jobSeeker") {
    // Create or update JobSeekerProfile
    const jobSeekerData = {
      ...updateData,
      name: user.name, // Add user name to profile
      // Ensure workExperience has the right structure
      workExperience: updateData.workExperience?.map(exp => ({
        jobTitle: exp.jobTitle || "",
        company: {
          name: exp.company?.name || "",
          logoUrl: exp.company?.logoUrl || "",
          domain: exp.company?.domain || "",
        },
        currentJob: !updateData.notEmployed, // Set currentJob based on employment status
      })) || [],
    };

    let jobSeekerProfile;
    if (user.jobSeekerProfile) {
      // Update existing profile
      jobSeekerProfile = await JobSeekerProfile.findByIdAndUpdate(
        user.jobSeekerProfile,
        jobSeekerData,
        { new: true }
      );
    } else {
      // Create new profile
      jobSeekerProfile = await JobSeekerProfile.create(jobSeekerData);
      profileId = jobSeekerProfile._id;
    }
  } else if (user.role === "employer") {
    // Create or update CompanyProfile
    const companyData = {
      ...updateData,
      // Ensure companySize has proper number types
      companySize: {
        from: parseInt(updateData.companySize?.from) || 0,
        to: parseInt(updateData.companySize?.to) || 0,
      },
      // Ensure companySocialProfiles is properly structured
      companySocialProfiles: updateData.companySocialProfiles || {},
    };

    let companyProfile;
    if (user.companyProfile) {
      // Update existing profile
      companyProfile = await CompanyProfile.findByIdAndUpdate(
        user.companyProfile,
        companyData,
        { new: true }
      );
    } else {
      // Create new profile
      companyProfile = await CompanyProfile.create(companyData);
      profileId = companyProfile._id;
    }
  }

  // Update user with profile reference and keep userProfile for backward compatibility
  const updateFields = {
    userProfile: updateData, // Keep for backward compatibility
  };

  if (profileId) {
    if (user.role === "jobSeeker") {
      updateFields.jobSeekerProfile = profileId;
    } else if (user.role === "employer") {
      updateFields.companyProfile = profileId;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true }
  ).select("-password -refreshToken").populate('jobSeekerProfile').populate('companyProfile');

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(new ApiResponse(200, { user: updatedUser }, "User profile updated successfully"));
});

const getSavedJobs = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get the job seeker profile and populate saved jobs
  const jobSeekerProfile = await JobSeekerProfile.findOne({ user: userId })
    .populate('savedJobs');
  
  if (!jobSeekerProfile) {
    return res.status(200).json(new ApiResponse(200, [], "No saved jobs found"));
  }
  
  return res.status(200).json(
    new ApiResponse(200, jobSeekerProfile.savedJobs || [], "Saved jobs fetched successfully")
  );
});

const getMyApplications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get all applications by this user
  const applications = await Application.find({ applicant: userId })
    .populate('job')
    .sort({ createdAt: -1 });
  
  return res.status(200).json(
    new ApiResponse(200, applications, "Applications fetched successfully")
  );
});

const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetch successful"));
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  const profilePictureLocalPath = req.file?.path;

  console.log('Profile picture upload request:', {
    file: req.file,
    filePath: profilePictureLocalPath,
    userId: req.user._id
  });

  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture file is missing");
  }

  let user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  let oldProfilePictureUrl = user?.userProfile?.profilePicture;

  console.log('Attempting to upload to Cloudinary...');
  
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);
  
  console.log('Cloudinary upload result:', profilePicture);
  
  if (!profilePicture || !profilePicture.url) {
    console.error('Cloudinary upload failed - no URL returned');
    throw new ApiError(400, "Error while uploading profile picture to cloud storage");
  }

  console.log('Successfully uploaded to Cloudinary:', profilePicture.url);

  // Update user profile based on role
  const updateData = user.role === "jobSeeker" 
    ? { "userProfile.profilePicture": profilePicture.url }
    : { "userProfile.companyLogo": profilePicture.url };

  user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateData },
    { new: true }
  ).select("-password -refreshToken");

  console.log('User profile updated successfully');

  // Clean up old profile picture from Cloudinary
  if (
    oldProfilePictureUrl &&
    oldProfilePictureUrl !==
      "https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg"
  ) {
    try {
      const splitUrl = oldProfilePictureUrl.split("/");
      const filenameWithExtension = splitUrl[splitUrl.length - 1];
      const imageId = filenameWithExtension.split(".")[0];
      await deleteFromCloudinary(imageId);
      console.log('Old profile picture deleted from Cloudinary');
    } catch (error) {
      console.error('Error deleting old profile picture:', error.message);
      // Don't throw error here as the main operation succeeded
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "User profile picture updated successfully")
    );
});

const addSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }

  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills.push(skill);
  user.markModified("userProfile.skills");
  await user.save();

  const updatedUser = await User.findById(req.user._id);
  console.log(updatedUser.userProfile.skills);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedUser.userProfile.skills,
        "Skills updated successfully"
      )
    );
});

const removeSkill = asyncHandler(async (req, res) => {
  const { skill } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!skill) {
    throw new ApiError(400, "Skill is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.skills = user.userProfile.skills.filter((s) => s !== skill);
  user.markModified("userProfile.skills");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Skills removed successfully"));
});

const updateResume = asyncHandler(async (req, res) => {
  const { resume } = req.body;
  const { role } = req.user;
  if (role !== "jobSeeker") {
    throw new ApiError(401, "You are not authorized to perform this action");
  }
  if (!resume) {
    throw new ApiError(400, "Resume is required");
  }

  const user = await User.findById(req.user._id);
  user.userProfile.resume = resume;
  user.markModified("userProfile.resume");
  await user.save();
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Resume updated successfully"));
});

// AI-powered skill gap analysis
const analyzeSkillGap = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { jobId } = req.params;

  const user = await User.findById(userId);
  if (!user || user.role !== 'jobSeeker') {
    throw new ApiError(403, 'Only job seekers can analyze skill gaps');
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw new ApiError(404, 'Job not found');
  }

  const analysis = await analyzeSkillGapsAI(user.userProfile, job);

  return res.status(200).json(
    new ApiResponse(200, analysis, 'Skill gap analysis completed successfully')
  );
});

// Change password
// Stores the interface language so emails and notifications match it
const updateLanguage = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { language: req.body.language });
  return res.status(200).json(new ApiResponse(200, { language: req.body.language }, "Language updated"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new ApiError(400, "New password must be at least 6 characters long");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isCurrentPasswordValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});

// Testing endpoints
const ping = (req, res) => {
  res.send("User API is working");
};
const authPing = (req, res) => {
  res.send("User Auth is working");
};

const userPublicProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId).select(
    "email _id userProfile.profilePicture userProfile.address userProfile.bio userProfile.location userProfile.yearsOfExperience userProfile.socialProfiles userProfile.workExperience userProfile.education userProfile.skills userProfile.name userProfile.resume"
  );
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile fetch successful"));
});

// Step 1: email a 6-digit reset code. The response is identical whether or not
// the account exists, so the endpoint cannot be used to discover registered emails.
const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();

  const genericResponse = new ApiResponse(
    200,
    {},
    "If an account exists for this email, a reset code has been sent."
  );

  const user = await User.findOne({ email }).select("+passwordResetExpires");
  if (!user) {
    return res.status(200).json(genericResponse);
  }

  // Ignore repeat requests made within the cooldown window
  if (isInResendCooldown(user.passwordResetExpires)) {
    return res.status(200).json(genericResponse);
  }

  const code = generateOtp();
  user.passwordResetCodeHash = hashOtp(user._id, code, "password-reset");
  user.passwordResetExpires = otpExpiry();
  user.passwordResetAttempts = 0;
  await user.save({ validateBeforeSave: false });

  await sendPasswordResetCode({
    to: user.email,
    name: user.name,
    code,
    expiresInMinutes: OTP_TTL_MINUTES,
    lang: user.language,
  });

  return res.status(200).json(genericResponse);
});

// Step 2: verify the emailed code and set the new password.
const resetPassword = asyncHandler(async (req, res) => {
  const { email, code, password } = req.body; // shape validated by zod

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+passwordResetCodeHash +passwordResetExpires +passwordResetAttempts"
  );

  const invalid = new ApiError(400, "Invalid or expired code");
  if (!user || !user.passwordResetCodeHash || !user.passwordResetExpires) {
    throw invalid;
  }
  if (user.passwordResetExpires.getTime() < Date.now() || user.passwordResetAttempts >= OTP_MAX_ATTEMPTS) {
    throw invalid;
  }

  if (!otpMatches(user.passwordResetCodeHash, user._id, code, "password-reset")) {
    user.passwordResetAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw invalid;
  }

  user.password = password; // hashed by the pre-save hook
  user.passwordResetCodeHash = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetAttempts = 0;
  user.refreshToken = undefined; // sign out existing sessions
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password updated successfully"));
});

// ---- Email verification ---------------------------------------------------

const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "+emailVerificationCodeHash +emailVerificationExpires +emailVerificationAttempts"
  );

  if (user.emailVerified !== false) {
    return res.status(200).json(new ApiResponse(200, { emailVerified: true }, "Email already verified"));
  }

  const invalid = new ApiError(400, "Invalid or expired code");
  if (!user.emailVerificationCodeHash || !user.emailVerificationExpires) throw invalid;
  if (user.emailVerificationExpires.getTime() < Date.now() || user.emailVerificationAttempts >= OTP_MAX_ATTEMPTS) {
    throw invalid;
  }

  if (!otpMatches(user.emailVerificationCodeHash, user._id, req.body.code, "verify-email")) {
    user.emailVerificationAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw invalid;
  }

  user.emailVerified = true;
  user.emailVerificationCodeHash = undefined;
  user.emailVerificationExpires = undefined;
  user.emailVerificationAttempts = 0;
  await user.save({ validateBeforeSave: false });

  void notify(user._id, {
    type: "system",
    key: "emailVerified",
  });

  return res.status(200).json(new ApiResponse(200, { emailVerified: true }, "Email verified successfully"));
});

const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+emailVerificationExpires");

  if (user.emailVerified !== false) {
    return res.status(200).json(new ApiResponse(200, { emailVerified: true }, "Email already verified"));
  }
  if (isInResendCooldown(user.emailVerificationExpires)) {
    throw new ApiError(429, "A code was sent moments ago. Please wait a minute before requesting another.");
  }

  await issueEmailVerification(user);
  return res.status(200).json(new ApiResponse(200, {}, "Verification code sent"));
});

// ---- Google sign-in ---------------------------------------------------------

const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role, language } = req.body;

  let profile;
  try {
    profile = await verifyGoogleCredential(credential);
  } catch (error) {
    throw new ApiError(401, error.message || "Google sign-in failed");
  }

  if (!profile.emailVerified) {
    throw new ApiError(401, "Your Google email address is not verified");
  }

  let user = await User.findOne({ email: profile.email.toLowerCase() });

  if (!user) {
    // First visit: we need to know whether this is a job seeker or an employer
    if (!role) {
      return res.status(200).json(
        new ApiResponse(
          200,
          { needsRole: true, profile: { email: profile.email, name: profile.name, picture: profile.picture } },
          "Choose an account type to finish signing up"
        )
      );
    }

    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: profile.email.toLowerCase(),
      username: profile.email.split("@")[0].toLowerCase(),
      // Google accounts never use a password, but the schema requires one
      password: crypto.randomBytes(32).toString("hex"),
      role,
      language,
      emailVerified: true,
      googleId: profile.sub,
    });
  } else {
    if (user.isSuspended) {
      throw new ApiError(403, "Your account has been suspended. Contact support for help.");
    }
    if (!user.googleId) user.googleId = profile.sub;
    if (user.emailVerified === false) user.emailVerified = true; // Google already verified it
  }

  if (user.twoFactorEnabled) {
    return res.status(200).json(
      new ApiResponse(200, { twoFactorRequired: true, twoFactorToken: signPendingTwoFactorToken(user._id) }, "Enter your two-factor code")
    );
  }

  return completeLogin(res, user, "Google sign-in successful");
});

// ---- Two-factor authentication (TOTP) ---------------------------------------------

/** Step 2 of login for an account with 2FA enabled: redeem the pending token with a code. */
const verifyTwoFactorLogin = asyncHandler(async (req, res) => {
  const { twoFactorToken, code } = req.body;

  const userId = readPendingTwoFactorToken(twoFactorToken);
  if (!userId) throw new ApiError(401, "This two-factor session has expired. Please log in again.");

  const user = await User.findById(userId).select("+twoFactorSecret +twoFactorBackupCodeHashes");
  if (!user) throw new ApiError(404, "User not found");
  if (!user.twoFactorEnabled) throw new ApiError(400, "Two-factor authentication is not enabled for this account");
  if (user.isSuspended) throw new ApiError(403, "Your account has been suspended. Contact support for help.");

  const isTotpValid = await verifyTwoFactorToken(user.twoFactorSecret, code);
  if (isTotpValid) {
    return completeLogin(res, user, "User login successful");
  }

  const { valid, remainingHashes } = consumeBackupCode(user.twoFactorBackupCodeHashes, code);
  if (!valid) throw new ApiError(401, "Invalid or expired two-factor code");

  user.twoFactorBackupCodeHashes = remainingHashes;
  await user.save({ validateBeforeSave: false });
  return completeLogin(res, user, "User login successful");
});

/** Starts setup: generates a secret and returns a QR code, but doesn't enable 2FA yet. */
const setupTwoFactor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user.twoFactorEnabled) throw new ApiError(400, "Two-factor authentication is already enabled. Disable it first to set up a new device.");

  const secret = generateTwoFactorSecret();
  user.twoFactorPendingSecret = secret;
  await user.save({ validateBeforeSave: false });

  const otpauthUrl = twoFactorOtpauthUrl(user.email, secret);
  const qrCode = await twoFactorQrCodeDataUrl(otpauthUrl);
  return res.status(200).json(new ApiResponse(200, { secret, otpauthUrl, qrCode }, "Scan the QR code with your authenticator app"));
});

/** Confirms setup with a code from the app, turns 2FA on, and issues one-time backup codes. */
const enableTwoFactor = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select("+twoFactorPendingSecret");
  if (user.twoFactorEnabled) throw new ApiError(400, "Two-factor authentication is already enabled");
  if (!user.twoFactorPendingSecret) throw new ApiError(400, "Start setup first by requesting a QR code");

  const isValid = await verifyTwoFactorToken(user.twoFactorPendingSecret, token);
  if (!isValid) throw new ApiError(401, "That code didn't match. Check your authenticator app and try again.");

  const { plaintext, hashes } = generateBackupCodes();
  user.twoFactorSecret = user.twoFactorPendingSecret;
  user.twoFactorPendingSecret = undefined;
  user.twoFactorEnabled = true;
  user.twoFactorBackupCodeHashes = hashes;
  await user.save({ validateBeforeSave: false });

  void notify(user._id, { type: "system", key: "twoFactorEnabled" });
  return res.status(200).json(new ApiResponse(200, { backupCodes: plaintext }, "Two-factor authentication is now enabled"));
});

/** Turns 2FA off. Requires the password and a current code, so a hijacked session alone can't disable it. */
const disableTwoFactor = asyncHandler(async (req, res) => {
  const { password, code } = req.body;
  const user = await User.findById(req.user._id).select("+twoFactorSecret +twoFactorBackupCodeHashes");
  if (!user.twoFactorEnabled) throw new ApiError(400, "Two-factor authentication is not enabled");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Current password is incorrect");

  const isTotpValid = await verifyTwoFactorToken(user.twoFactorSecret, code);
  const { valid: isBackupValid } = isTotpValid ? { valid: false } : consumeBackupCode(user.twoFactorBackupCodeHashes, code);
  if (!isTotpValid && !isBackupValid) throw new ApiError(401, "Invalid or expired two-factor code");

  user.twoFactorEnabled = false;
  user.twoFactorSecret = undefined;
  user.twoFactorPendingSecret = undefined;
  user.twoFactorBackupCodeHashes = [];
  await user.save({ validateBeforeSave: false });

  void notify(user._id, { type: "system", key: "twoFactorDisabled" });
  return res.status(200).json(new ApiResponse(200, {}, "Two-factor authentication is now disabled"));
});

/** Invalidates old backup codes and issues a fresh set. Requires a current authenticator code. */
const regenerateTwoFactorBackupCodes = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findById(req.user._id).select("+twoFactorSecret");
  if (!user.twoFactorEnabled) throw new ApiError(400, "Two-factor authentication is not enabled");

  const isValid = await verifyTwoFactorToken(user.twoFactorSecret, token);
  if (!isValid) throw new ApiError(401, "That code didn't match. Check your authenticator app and try again.");

  const { plaintext, hashes } = generateBackupCodes();
  user.twoFactorBackupCodeHashes = hashes;
  await user.save({ validateBeforeSave: false });

  void notify(user._id, { type: "system", key: "twoFactorBackupCodesRegenerated" });
  return res.status(200).json(new ApiResponse(200, { backupCodes: plaintext }, "New backup codes generated"));
});

/** For the account settings screen: whether 2FA is on, and how many backup codes are left. */
const getTwoFactorStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+twoFactorBackupCodeHashes");
  return res.status(200).json(
    new ApiResponse(200, {
      enabled: user.twoFactorEnabled,
      backupCodesRemaining: user.twoFactorEnabled ? user.twoFactorBackupCodeHashes.length : 0,
    }, "Two-factor status fetched")
  );
});

export { 
  registerUser, 
  loginUser, 
  logoutUser, 
  getCurrentUser, 
  updateUserProfile,
  getSavedJobs,
  getMyApplications,
  getUserProfile,
  ping,
  authPing,
  updateProfilePicture,
  addSkill,
  removeSkill,
  updateResume,
  userPublicProfile,
  analyzeSkillGap,
  changePassword,
  updateLanguage,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleLogin,
  verifyTwoFactorLogin,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  regenerateTwoFactorBackupCodes,
  getTwoFactorStatus,
};