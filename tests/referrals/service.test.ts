/* eslint-disable @typescript-eslint/no-explicit-any -- The fake Prisma transaction client models the lock and commit boundary for service tests. */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, state, createUserWithDefaults } = vi.hoisted(() => {
  const state = { referrals: 0, granted: 0, rewards: [] as Array<Record<string, unknown>>, id: 0, inviterId: "inviter" };
  const prisma: any = {};
  return { prisma, state, createUserWithDefaults: vi.fn() };
});

vi.mock("@/lib/db/prisma", () => ({ prisma }));
vi.mock("@/server/services/users", () => ({ createUserWithDefaults }));

import { createUserWithReferral } from "@/server/services/referrals";

describe("referral registration transaction", () => {
  const now = new Date("2026-10-06T08:00:00.000Z");
  let inviterSubscription: { status: string; currentPeriodEnd: Date | null; trialEndsAt: Date };
  let referredSubscription: { status: string; currentPeriodEnd: Date | null; trialEndsAt: Date };
  let lockTail: Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    state.referrals = 0;
    state.granted = 0;
    state.rewards = [];
    state.id = 0;
    state.inviterId = "inviter";
    lockTail = Promise.resolve();
    inviterSubscription = { status: "TRIALING", currentPeriodEnd: null, trialEndsAt: new Date("2026-10-13T08:00:00.000Z") };
    referredSubscription = { status: "TRIALING", currentPeriodEnd: null, trialEndsAt: new Date("2026-10-13T08:00:00.000Z") };

    prisma.$transaction = async (callback: (tx: any) => Promise<unknown>) => {
      const releases: Array<() => void> = [];
      const tx = {
        user: { findFirst: vi.fn(async () => ({ id: state.inviterId })) },
        referral: {
          create: vi.fn(async ({ data }: any) => {
            state.referrals += 1;
            return { id: `ref-${state.referrals}`, ...data };
          }),
          count: vi.fn(async () => state.referrals),
        },
        referralReward: {
          aggregate: vi.fn(async () => ({ _sum: { grantedDays: state.granted } })),
          createMany: vi.fn(async ({ data }: any) => {
            state.rewards.push(...data);
            state.granted += data.find((row: any) => row.type === "INVITER")?.grantedDays ?? 0;
            return { count: data.length };
          }),
        },
        subscription: {
          findUniqueOrThrow: vi.fn(async ({ where }: any) => where.userId === "inviter" ? inviterSubscription : referredSubscription),
          update: vi.fn(async ({ where, data }: any) => {
            if (where.userId === "inviter") Object.assign(inviterSubscription, data);
            else Object.assign(referredSubscription, data);
            return where.userId === "inviter" ? inviterSubscription : referredSubscription;
          }),
        },
        $executeRaw: async () => {
          const waitFor = lockTail;
          let release!: () => void;
          lockTail = new Promise<void>((resolve) => { release = resolve; });
          await waitFor;
          releases.push(release);
        },
      };
      try {
        return await callback(tx);
      } finally {
        releases.forEach((release) => release());
      }
    };
    createUserWithDefaults.mockImplementation(async () => {
      state.id += 1;
      return { id: `new-${state.id}` };
    });
  });

  it("adds seven days to the new user's base seven-day trial", async () => {
    await createUserWithReferral({ email: "new@example.com", referralCode: "INVITER1", now });
    expect(referredSubscription.trialEndsAt.toISOString()).toBe("2026-10-20T08:00:00.000Z");
    expect(state.rewards.find((reward) => reward.type === "INVITEE")).toMatchObject({ requestedDays: 7, grantedDays: 7 });
  });

  it("awards inviter the requested 7/7/16 cycle and truncates at 90 days", async () => {
    state.referrals = 2;
    state.granted = 80;
    await createUserWithReferral({ email: "new@example.com", referralCode: "INVITER1", now });
    expect(state.rewards.find((reward) => reward.type === "INVITER")).toMatchObject({
      cyclePosition: 3,
      requestedDays: 16,
      grantedDays: 10,
    });
    expect(inviterSubscription.trialEndsAt.toISOString()).toBe("2026-10-23T08:00:00.000Z");
  });

  it("extends the active paid period end for an active subscriber", async () => {
    inviterSubscription.status = "ACTIVE";
    inviterSubscription.currentPeriodEnd = new Date("2026-11-01T08:00:00.000Z");
    await createUserWithReferral({ email: "paid-referral@example.com", referralCode: "INVITER1", now });
    expect(inviterSubscription.currentPeriodEnd?.toISOString()).toBe("2026-11-08T08:00:00.000Z");
    expect(inviterSubscription.trialEndsAt.toISOString()).toBe("2026-10-13T08:00:00.000Z");
  });

  it("serializes simultaneous registrations for the same inviter", async () => {
    await Promise.all([
      createUserWithReferral({ email: "a@example.com", referralCode: "INVITER1", now }),
      createUserWithReferral({ email: "b@example.com", referralCode: "INVITER1", now }),
    ]);
    expect(state.referrals).toBe(2);
    expect(state.rewards.filter((reward) => reward.type === "INVITER").map((reward) => reward.cyclePosition).sort()).toEqual([1, 2]);
  });

  it("rejects unknown/inactive codes and self-referrals before recording rewards", async () => {
    prisma.$transaction = async (callback: (tx: any) => Promise<unknown>) => callback({
      user: { findFirst: vi.fn(async () => null) },
    });
    await expect(createUserWithReferral({ email: "new@example.com", referralCode: "BADCODE", now }))
      .rejects.toThrow("INVALID_REFERRAL_CODE");
    expect(state.rewards).toHaveLength(0);

    prisma.$transaction = async (callback: (tx: any) => Promise<unknown>) => callback({
      user: { findFirst: vi.fn(async () => ({ id: "new-1" })) },
    });
    await expect(createUserWithReferral({ email: "self@example.com", referralCode: "INVITER1", now }))
      .rejects.toThrow("SELF_REFERRAL");
    expect(state.rewards).toHaveLength(0);
  });

  it("does not create a second reward when the database rejects a duplicate referral", async () => {
    prisma.$transaction = async (callback: (tx: any) => Promise<unknown>) => callback({
      user: { findFirst: vi.fn(async () => ({ id: "inviter" })) },
      referral: { create: vi.fn(async () => { throw new Error("P2002"); }) },
      $executeRaw: vi.fn(),
    });
    await expect(createUserWithReferral({ email: "duplicate@example.com", referralCode: "INVITER1", now }))
      .rejects.toThrow("P2002");
    expect(state.rewards).toHaveLength(0);
  });
});
