import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { OTP_LENGTH, OTP_TTL_MS, SESSION_TTL_DAYS } from "@/lib/config/app";

function pepper(): string {
  const value = process.env.OTP_PEPPER;
  if (!value || value.length < 16) {
    throw new Error("OTP_PEPPER is not configured.");
  }
  return value;
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(`${pepper()}:${value}`).digest("hex");
}

export function generateOtpCode(): string {
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return String(randomInt(min, max));
}

export function hashOtp(phone: string, code: string): string {
  return hashSecret(`${phone}:${code}`);
}

export function otpEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashSecret(token) };
}

export function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function otpExpiry(from = new Date()): Date {
  return new Date(from.getTime() + OTP_TTL_MS);
}

export function isOtpExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
