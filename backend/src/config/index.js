// Central place for environment-driven feature flags and limits.

const bool = (value, fallback = false) => {
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

export const config = {
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get isTest() {
    return process.env.NODE_ENV === "test";
  },
  get corsOrigins() {
    return (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);
  },
  /** When true, unverified accounts cannot apply, post jobs or send messages. */
  get requireEmailVerification() {
    return bool(process.env.REQUIRE_EMAIL_VERIFICATION, false);
  },
  /** Off under test unless RATE_LIMIT_DISABLED=false is set explicitly. */
  get rateLimitDisabled() {
    return bool(process.env.RATE_LIMIT_DISABLED, this.isTest);
  },
  get clientUrl() {
    return (process.env.CLIENT_URL || this.corsOrigins[0] || "http://localhost:5173").replace(/\/$/, "");
  },
  get googleClientId() {
    return process.env.GOOGLE_CLIENT_ID || "";
  },
};
