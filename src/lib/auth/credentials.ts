import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/config/app";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "ایمیل معتبر نیست.")
  .max(254, "ایمیل معتبر نیست.")
  .refine((value) => EMAIL_PATTERN.test(value), "ایمیل معتبر نیست.");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, "رمز عبور حداقل ۸ کاراکتر باشد.")
  .max(PASSWORD_MAX_LENGTH, "رمز عبور خیلی بلند است.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "رمز عبور را وارد کن.")
    .max(PASSWORD_MAX_LENGTH, "رمز عبور خیلی بلند است."),
});

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .max(60, "نام خیلی بلند است.")
    .transform((value) => value || undefined),
  email: emailSchema,
  password: passwordSchema,
});
