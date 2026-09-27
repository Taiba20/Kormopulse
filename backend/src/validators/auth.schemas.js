import { z } from "zod";

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

const password = z
  .string({ error: "Password is required" })
  .min(6, { error: "Password must be at least 6 characters long" })
  .max(128, { error: "Password is too long" });

const code = z
  .string({ error: "Code is required" })
  .trim()
  .regex(/^\d{6}$/, { error: "Code must be 6 digits" });

// Only these two roles may be chosen at signup. "admin" is created out of band.
export const signupRole = z.enum(["jobSeeker", "employer"], {
  error: "Role must be jobSeeker or employer",
});

// Interface language chosen in the app; emails and notifications are written in it
export const languageEnum = z.enum(["en", "bn"], { error: "Language must be en or bn" });

export const signupSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, { error: "Name is too short" }).max(80),
  email,
  password,
  role: signupRole,
  language: languageEnum.optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ email, code, password, confirmPassword: z.string({ error: "Confirm your password" }) })
  .refine((v) => v.password === v.confirmPassword, {
    error: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({ code });

export const googleLoginSchema = z.object({
  credential: z.string({ error: "Google credential is required" }).min(10),
  role: signupRole.optional(),
  language: languageEnum.optional(),
});

export const updateLanguageSchema = z.object({ language: languageEnum });

// A 6-digit code from an authenticator app, required to set up or confirm 2FA.
export const twoFactorTokenSchema = z.object({ token: code });

// At login (and when disabling 2FA) either a 6-digit authenticator code or a longer backup
// code ("XXXXX-XXXXX") is accepted, so this is looser than `code` above.
const twoFactorCode = z
  .string({ error: "Code is required" })
  .trim()
  .min(6, { error: "Enter your 6-digit code or a backup code" })
  .max(20, { error: "Code is too long" });

export const twoFactorLoginVerifySchema = z.object({
  twoFactorToken: z.string({ error: "Two-factor token is required" }).min(10, { error: "Two-factor token is required" }),
  code: twoFactorCode,
});

export const twoFactorDisableSchema = z.object({
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
  code: twoFactorCode,
});
