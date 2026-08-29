import { describe, expect, it } from "vitest";
import { hashPassword, passwordMatches, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("round-trips a password", async () => {
    const stored = await hashPassword("correct horse");
    expect(stored.startsWith("scrypt:")).toBe(true);
    await expect(verifyPassword("correct horse", stored)).resolves.toBe(true);
    await expect(verifyPassword("wrong", stored)).resolves.toBe(false);
  });

  it("rejects a missing hash without throwing", async () => {
    await expect(passwordMatches("secret123", null)).resolves.toBe(false);
    await expect(passwordMatches("secret123", undefined)).resolves.toBe(false);
  });

  it("rejects a malformed stored hash", async () => {
    await expect(verifyPassword("secret123", "not-a-hash")).resolves.toBe(false);
  });
});
