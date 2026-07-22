import { z } from "zod";

/** Bangladesh mobile: 01XXXXXXXXX (also accepts +880 / 880 prefixes). */
export const bdPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    let local = digits;
    if (local.startsWith("880") && local.length >= 13) local = `0${local.slice(3)}`;
    else if (local.length === 10 && local.startsWith("1")) local = `0${local}`;
    return /^01[3-9]\d{8}$/.test(local);
  }, "Enter a valid Bangladesh mobile number (e.g. 01712345678)");

export function normalizeBdPhoneClient(value: string): string {
  const digits = value.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("880") && local.length >= 13) local = `0${local.slice(3)}`;
  else if (local.length === 10 && local.startsWith("1")) local = `0${local}`;
  return local;
}

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(72, "Password is too long");

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit OTP code");

export const loginSchema = z.object({
  phone: bdPhoneSchema,
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

export const registerDetailsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name is too long"),
    phone: bdPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/** @deprecated Prefer registerDetailsSchema + otp step */
export const registerSchema = registerDetailsSchema;

export const registerOtpSchema = z.object({
  otp: otpCodeSchema,
});

export const forgotPasswordSchema = z.object({
  phone: bdPhoneSchema,
});

export const resetPasswordSchema = z
  .object({
    otp: otpCodeSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerDetailsSchema>;
export type RegisterOtpFormValues = z.infer<typeof registerOtpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
