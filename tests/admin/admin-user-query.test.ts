import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { GET } from "@/app/api/admin/users/[id]/route";
import {
  ADMIN_USER_ALLOWED_KEYS,
  ADMIN_USER_FORBIDDEN_KEYS,
  buildAdminUserView,
} from "@/server/admin/admin-user-query";

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/queries/admin/subscribers", () => ({
  maybePromoteBootstrapAdmin: vi.fn(async (user) => user),
}));

describe("admin user privacy boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the admin user response allow-list strict", () => {
    const view = buildAdminUserView({
      id: "user-1",
      email: "user@example.com",
      name: "User One",
      role: "USER",
      status: "ACTIVE",
      locale: "fa-IR",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      lastActiveAt: new Date("2025-03-01T10:00:00.000Z"),
      onboardingCompletedAt: new Date("2025-01-18T00:00:00.000Z"),
      incomeDayOfMonth: 14,
      googleId: null,
      passwordHash: "hash",
      subscription: {
        status: "ACTIVE",
        trialEndsAt: new Date("2025-02-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2025-04-01T00:00:00.000Z"),
      },
      _count: {
        accounts: 2,
        transactions: 12,
        budgets: 3,
        goals: 1,
        recurring: 1,
        sessions: 4,
      },
    } as any);

    expect(view).not.toBeNull();
    expect(Object.keys(view!).sort()).toEqual([...ADMIN_USER_ALLOWED_KEYS].sort());

    for (const forbiddenKey of ADMIN_USER_FORBIDDEN_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(view, forbiddenKey)).toBe(false);
    }
  });

  it("sanitizes the admin API response even when the db row contains financial fields", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "ADMIN",
      status: "ACTIVE",
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      name: "User One",
      role: "USER",
      status: "ACTIVE",
      locale: "fa-IR",
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
      lastActiveAt: new Date("2025-03-01T10:00:00.000Z"),
      onboardingCompletedAt: new Date("2025-01-18T00:00:00.000Z"),
      incomeDayOfMonth: 14,
      googleId: null,
      passwordHash: "hash",
      subscriptions: null,
      subscription: {
        status: "ACTIVE",
        trialEndsAt: new Date("2025-02-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2025-04-01T00:00:00.000Z"),
      },
      _count: {
        accounts: 2,
        transactions: 12,
        budgets: 3,
        goals: 1,
        recurring: 1,
        sessions: 4,
      },
      accounts: [{ id: "a1", name: "Main account", balance: 150000n, isActive: true }],
      transactions: [{ id: "t1", amount: 50000n, merchant: "Market", category: { name: "Groceries" } }],
      budgets: [{ id: "b1", category: "Food", amount: 200000n }],
      goals: [{ id: "g1", name: "Trip", targetAmount: 500000n, currentAmount: 200000n }],
      recurringTransactions: [{ id: "rt1", amount: 250000n }],
      totalBalance: 150000n,
      monthlyIncome: 200000n,
      monthlyExpense: 100000n,
      monthlySaved: 100000n,
      recentTransactions: [{ id: "t2", amount: 25000n }],
    } as any);

    const response = await GET(new Request("http://localhost/api/admin/users/user-1"), {
      params: Promise.resolve({ id: "user-1" }),
    });

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(Object.keys(json).sort()).toEqual([...ADMIN_USER_ALLOWED_KEYS].sort());
    for (const forbiddenKey of ADMIN_USER_FORBIDDEN_KEYS) {
      expect(Object.prototype.hasOwnProperty.call(json, forbiddenKey)).toBe(false);
    }
    expect(json).toMatchObject({
      id: "user-1",
      email: "user@example.com",
      name: "User One",
      readOnlyMode: false,
      counts: {
        activeSessions: 4,
        accountCount: 2,
        transactionCount: 12,
        budgetCount: 3,
        goalCount: 1,
        recurringCount: 1,
      },
    });
  });
});
