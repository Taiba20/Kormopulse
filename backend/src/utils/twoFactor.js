import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateSecret as generateTotpSecret, generate as generateTotp, verify as verifyTotp, generateURI } from "otplib";
import QRCode from "qrcode";

const APP_NAME = "Kormopulse";
// One step (30s) of tolerance each side, so a slow typist or a slightly-off device clock isn't
// rejected. TOTP codes still expire quickly, so this doesn't meaningfully weaken the check.
const EPOCH_TOLERANCE_SECONDS = 30;

const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I, easier to type by hand

// Used to sign the short-lived "password verified, waiting on the second factor" token issued
// between the two login steps. Deriving it from ACCESS_TOKEN_SECRET means no extra env var is
// needed, while keeping the token unusable as a real access token: verifyJWT checks the access
// token against ACCESS_TOKEN_SECRET directly, so a token signed with this derived key fails that
// check with a signature mismatch rather than being accepted as a full session.
const pendingTwoFactorSecret = () => `${process.env.ACCESS_TOKEN_SECRET || "kormopulse"}::2fa-pending`;
const PENDING_TWO_FACTOR_TTL = "10m";

/** A fresh base32 TOTP secret for a user who is setting up 2FA. */
export const generateTwoFactorSecret = () => generateTotpSecret();

/** The otpauth:// URI to render as a QR code / manual entry key in an authenticator app. */
export const twoFactorOtpauthUrl = (email, secret) => generateURI({ issuer: APP_NAME, label: email, secret });

/** PNG data URI of the QR code for `otpauthUrl`, ready to drop into an <img src>. */
export const twoFactorQrCodeDataUrl = (otpauthUrl) => QRCode.toDataURL(otpauthUrl);

/** True when `token` (a 6-digit code from the user's authenticator app) matches `secret` right now. */
export const verifyTwoFactorToken = async (secret, token) => {
  if (!secret || !token || !/^\d{6}$/.test(String(token).trim())) return false;
  try {
    const result = await verifyTotp({ secret, token: String(token).trim(), epochTolerance: EPOCH_TOLERANCE_SECONDS });
    return result.valid;
  } catch {
    return false;
  }
};

/** Only used in tests, to generate a currently-valid code for a given secret. */
export const currentTwoFactorToken = (secret) => generateTotp({ secret });

const hashBackupCode = (code) =>
  crypto.createHash("sha256").update(String(code).toUpperCase().replace(/[\s-]/g, "")).digest("hex");

/** 10 fresh backup codes: `{ plaintext, hashes }`. Only the hashes are ever stored. */
export const generateBackupCodes = (count = BACKUP_CODE_COUNT) => {
  const plaintext = Array.from({ length: count }, () => {
    let code = "";
    for (let i = 0; i < 10; i += 1) code += BACKUP_CODE_ALPHABET[crypto.randomInt(BACKUP_CODE_ALPHABET.length)];
    return `${code.slice(0, 5)}-${code.slice(5)}`;
  });
  return { plaintext, hashes: plaintext.map(hashBackupCode) };
};

/**
 * Checks `code` against the stored backup-code hashes. Each code is single-use: on a match, the
 * matching hash is removed from the returned array so the caller can persist the smaller list.
 */
export const consumeBackupCode = (hashes, code) => {
  if (!code) return { valid: false, remainingHashes: hashes };
  const hash = hashBackupCode(code);
  const index = (hashes || []).indexOf(hash);
  if (index === -1) return { valid: false, remainingHashes: hashes };
  const remainingHashes = [...hashes.slice(0, index), ...hashes.slice(index + 1)];
  return { valid: true, remainingHashes };
};

/** Issued right after a correct password when 2FA is enabled; redeemed by the login-verify step. */
export const signPendingTwoFactorToken = (userId) =>
  jwt.sign({ _id: userId, purpose: "2fa-pending" }, pendingTwoFactorSecret(), { expiresIn: PENDING_TWO_FACTOR_TTL });

/** Returns the user id, or null if the token is missing, expired, forged, or the wrong kind. */
export const readPendingTwoFactorToken = (token) => {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, pendingTwoFactorSecret());
    return payload?.purpose === "2fa-pending" ? payload._id : null;
  } catch {
    return null;
  }
};
