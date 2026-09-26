import rateLimit from "express-rate-limit";
import { config } from "../config/index.js";

const build = ({ windowMs, limit, message }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => config.rateLimitDisabled,
    handler: (_req, res) =>
      res.status(429).json({ statusCode: 429, success: false, message }),
  });

/** Generous limit for the whole API. */
export const apiLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  message: "Too many requests. Please slow down and try again shortly.",
});

/** Strict limit for credential-related endpoints (login, signup, reset, verification). */
export const authLimiter = build({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: "Too many attempts. Please wait 15 minutes and try again.",
});

/** AI endpoints call a paid third-party API, so keep them tighter. */
export const aiLimiter = build({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  message: "AI usage limit reached. Please try again in an hour.",
});

export const createLimiter = build;
