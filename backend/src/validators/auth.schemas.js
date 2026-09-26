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

export const signupSchema = z.object({
  name: z.string({ error: "Name is required" }).trim().min(2, { error: "Name is too short" }).max(80),
  email,
  password,
  role: signupRole,
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
});
