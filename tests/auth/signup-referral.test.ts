import { beforeEach, describe, expect, it, vi } from "vitest";

const { createUserWithReferral, issueSession, hashPassword, assertSignupAllowed } = vi.hoisted(() => ({
  createUserWithReferral: vi.fn(),
  issueSession: vi.fn(),
  hashPassword: vi.fn(),
  assertSignupAllowed: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }) }));
vi.mock("@/server/services/referrals", () => ({ createUserWithReferral }));
vi.mock("@/lib/auth/password", () => ({ hashPassword, passwordMatches: vi.fn() }));
vi.mock("@/lib/auth/rate-limit", () => ({
  RateLimitError: class RateLimitError extends Error {},
  assertLoginAllowed: vi.fn(),
  assertSignupAllowed,
}));
vi.mock("@/lib/auth/session", () => ({
  clearSessionCookie: vi.fn(),
  extendSession: vi.fn(),
  issueSession,
  readSessionToken: vi.fn(),
  requireUser: vi.fn(),
  setSessionCookie: vi.fn(),
}));
vi.mock("@/lib/db/prisma", () => ({ prisma: { session: { deleteMany: vi.fn() }, user: { update: vi.fn() } } }));

import { signup } from "@/server/actions/auth";

describe("email signup referral flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashPassword.mockResolvedValue("hashed-password");
    issueSession.mockResolvedValue(undefined);
    createUserWithReferral.mockResolvedValue({ id: "new-user" });
  });

  it("passes the optional code into atomic user creation", async () => {
    const form = new FormData();
    form.set("name", "New User");
    form.set("email", "new@example.com");
    form.set("password", "secret123");
    form.set("referralCode", " refcode1 ");
    await expect(signup(undefined, form)).rejects.toThrow("REDIRECT:/home");
    expect(createUserWithReferral).toHaveBeenCalledWith(expect.objectContaining({
      email: "new@example.com",
      passwordHash: "hashed-password",
      referralCode: "refcode1",
    }));
    expect(issueSession).toHaveBeenCalledWith("new-user", expect.any(Headers));
  });

  it("creates a normal seven-day-trial account when no code is supplied", async () => {
    const form = new FormData();
    form.set("email", "plain@example.com");
    form.set("password", "secret123");
    await expect(signup(undefined, form)).rejects.toThrow("REDIRECT:/home");
    expect(createUserWithReferral).toHaveBeenCalledWith(expect.objectContaining({
      email: "plain@example.com",
      referralCode: undefined,
    }));
  });
});
