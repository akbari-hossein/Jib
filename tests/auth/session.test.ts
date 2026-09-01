import { describe, expect, it } from "vitest";
import { sessionExpiry } from "@/lib/auth/crypto";
import { SESSION_TTL_DAYS, SESSION_TTL_SECONDS } from "@/lib/config/app";

describe("session lifetime", () => {
  it("keeps sessions for 180 days", () => {
    expect(SESSION_TTL_DAYS).toBe(180);
    expect(SESSION_TTL_SECONDS).toBe(180 * 24 * 60 * 60);
  });

  it("computes expiry from the configured ttl", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    expect(sessionExpiry(from).getTime() - from.getTime()).toBe(SESSION_TTL_SECONDS * 1000);
  });
});
