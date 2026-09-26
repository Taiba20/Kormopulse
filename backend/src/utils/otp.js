import crypto from "crypto";

export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** Cryptographically random 6-digit code. */
export const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, "0");

/** Only a keyed hash of the code is ever stored. `purpose` keeps codes for different flows apart. */
export const hashOtp = (userId, code, purpose) =>
  crypto
    .createHmac("sha256", process.env.ACCESS_TOKEN_SECRET || "kormopulse")
    .update(`${purpose}:${userId}:${String(code).trim()}`)
    .digest("hex");

export const otpMatches = (storedHash, userId, code, purpose) => {
  if (!storedHash) return false;
  const expected = Buffer.from(storedHash, "hex");
  const provided = Buffer.from(hashOtp(userId, code, purpose), "hex");
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};

/** True when a new code was issued less than the cooldown ago (based on its expiry). */
export const isInResendCooldown = (expiresAt) => {
  if (!expiresAt) return false;
  const issuedAt = expiresAt.getTime() - OTP_TTL_MINUTES * 60 * 1000;
  return Date.now() - issuedAt < OTP_RESEND_COOLDOWN_MS;
};

export const otpExpiry = () => new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
