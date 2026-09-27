import { Router } from "express";
import {
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
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  googleLogin,
  updateLanguage,
  verifyTwoFactorLogin,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  regenerateTwoFactorBackupCodes,
  getTwoFactorStatus,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  googleLoginSchema,
  updateLanguageSchema,
  twoFactorTokenSchema,
  twoFactorLoginVerifySchema,
  twoFactorDisableSchema,
} from "../validators/auth.schemas.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/ping").get(ping);
router.route("/auth-ping").get(verifyJWT, authPing);
router.route("/signup").post(authLimiter, validate(signupSchema), registerUser);
router.route("/login").post(authLimiter, validate(loginSchema), loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-profile").put(verifyJWT, updateUserProfile);
router.route("/saved-jobs").get(verifyJWT, getSavedJobs);
router.route("/my-applications").get(verifyJWT, getMyApplications);
router.route("/profile").get(verifyJWT, getUserProfile);
router.route("/profile/jobseeker").patch(verifyJWT, updateUserProfile);
router.route("/profile-picture").post(verifyJWT, upload.single("profilePicture"), updateProfilePicture);
router.route("/add-skill").post(verifyJWT, addSkill);
router.route("/remove-skill").post(verifyJWT, removeSkill);
router.route("/resume").post(verifyJWT, updateResume);
router.route("/saved-jobs").get(verifyJWT, getSavedJobs);
router.route("/public-profile/:id").get(userPublicProfile);
router.route("/skill-gap/:jobId").get(verifyJWT, analyzeSkillGap);
router.route("/change-password").post(verifyJWT, changePassword);
router.route("/forgot-password").post(authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.route("/reset-password").post(authLimiter, validate(resetPasswordSchema), resetPassword);
router.route("/verify-email").post(authLimiter, verifyJWT, validate(verifyEmailSchema), verifyEmail);
router.route("/resend-verification").post(authLimiter, verifyJWT, resendVerification);
router.route("/google").post(authLimiter, validate(googleLoginSchema), googleLogin);
router.route("/language").patch(verifyJWT, validate(updateLanguageSchema), updateLanguage);

// Two-factor authentication: /2fa/login-verify is the second login step (no session yet, so no
// verifyJWT); the rest manage 2FA on an already-authenticated account.
router.route("/2fa/login-verify").post(authLimiter, validate(twoFactorLoginVerifySchema), verifyTwoFactorLogin);
router.route("/2fa/status").get(verifyJWT, getTwoFactorStatus);
router.route("/2fa/setup").post(verifyJWT, authLimiter, setupTwoFactor);
router.route("/2fa/enable").post(verifyJWT, authLimiter, validate(twoFactorTokenSchema), enableTwoFactor);
router.route("/2fa/disable").post(verifyJWT, authLimiter, validate(twoFactorDisableSchema), disableTwoFactor);
router.route("/2fa/backup-codes/regenerate").post(verifyJWT, authLimiter, validate(twoFactorTokenSchema), regenerateTwoFactorBackupCodes);

export default router;