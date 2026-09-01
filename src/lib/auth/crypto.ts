import { createHash, randomBytes } from "node:crypto";
import { SESSION_TTL_SECONDS } from "@/lib/config/app";

function secret(): string {
  const value = process.env.AUTH_SECRET ?? process.env.OTP_PEPPER;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return value;
}

export function hashSecret(value: string): string {
  return createHash("sha256").update(`${secret()}:${value}`).digest("hex");
}

export function generateSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, tokenHash: hashSecret(token) };
}

export function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_TTL_SECONDS * 1000);
}
