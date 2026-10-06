import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, createUserWithReferral } = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
  },
  createUserWithReferral: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({ prisma }));
vi.mock("@/server/services/referrals", () => ({ createUserWithReferral }));

import { findOrCreateGoogleUser } from "@/app/api/auth/google/callback/route";

describe("Google referral registration", () => {
  const profile = { googleId: "google-id", email: "user@example.com", name: "User" };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(null);
    createUserWithReferral.mockResolvedValue({ id: "new-user", status: "ACTIVE" });
  });

  it("passes the referral to creation only for a new Google account", async () => {
    await findOrCreateGoogleUser(profile, "REFCODE1");
    expect(createUserWithReferral).toHaveBeenCalledWith(expect.objectContaining({
      email: profile.email,
      googleId: profile.googleId,
      referralCode: "REFCODE1",
    }));
  });

  it("does not create a referral when Google connects to an existing account", async () => {
    const existing = { id: "existing-user", googleId: null, name: "Existing" };
    prisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    prisma.user.update.mockResolvedValue({ ...existing, googleId: profile.googleId });
    await findOrCreateGoogleUser(profile, "REFCODE1");
    expect(createUserWithReferral).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });
});
