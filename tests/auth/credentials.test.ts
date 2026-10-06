import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "@/lib/auth/credentials";

describe("loginSchema", () => {
  it("normalizes email", () => {
    const parsed = loginSchema.safeParse({
      email: "  User@Example.COM ",
      password: "secret",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe("user@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const parsed = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    const parsed = signupSchema.safeParse({
      name: " حسین ",
      email: "user@example.com",
      password: "secret123",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("حسین");
      expect(parsed.data.email).toBe("user@example.com");
    }
  });

  it("accepts an optional referral code and treats blank as omitted", () => {
    const referred = signupSchema.safeParse({
      name: "Friend",
      email: "friend@example.com",
      password: "secret123",
      referralCode: " abcd2345 ",
    });
    expect(referred.success && referred.data.referralCode).toBe("abcd2345");
    const blank = signupSchema.safeParse({
      name: "Friend",
      email: "friend@example.com",
      password: "secret123",
      referralCode: "  ",
    });
    expect(blank.success && blank.data.referralCode).toBeUndefined();
  });

  it("treats a blank name as omitted", () => {
    const parsed = signupSchema.safeParse({
      name: "   ",
      email: "user@example.com",
      password: "secret123",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBeUndefined();
    }
  });

  it("rejects a short password", () => {
    const parsed = signupSchema.safeParse({
      name: "",
      email: "user@example.com",
      password: "short",
    });
    expect(parsed.success).toBe(false);
  });
});
