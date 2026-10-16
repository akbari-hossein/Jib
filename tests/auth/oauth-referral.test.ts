import { afterEach, describe, expect, it } from "vitest";
import { signOAuthReferral, verifyOAuthReferral } from "@/lib/auth/google";

describe("Google OAuth referral state", () => {
  const original = process.env.AUTH_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = original;
  });

  it("verifies a state-bound signed referral cookie", () => {
    process.env.AUTH_SECRET = "test-auth-secret-with-more-than-16-chars";
    const cookie = signOAuthReferral("abc12345", "oauth-state");
    expect(verifyOAuthReferral(cookie, "oauth-state")).toBe("ABC12345");
    expect(verifyOAuthReferral(cookie, "another-state")).toBeNull();
    expect(verifyOAuthReferral(`${cookie}x`, "oauth-state")).toBeNull();
  });
});
