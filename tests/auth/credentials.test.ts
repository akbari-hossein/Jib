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
