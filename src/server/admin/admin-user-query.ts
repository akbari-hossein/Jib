import type { Prisma } from "@prisma/client";
import { isReadOnlyStatus } from "@/lib/subscription/access";
import { prisma } from "@/lib/db/prisma";
import type { AdminUserView } from "@/server/admin/admin-user.types";
import { ADMIN_USER_ALLOWED_KEYS } from "@/server/admin/admin-user.types";

export { ADMIN_USER_ALLOWED_KEYS, ADMIN_USER_FORBIDDEN_KEYS } from "@/server/admin/admin-user.types";

export type AdminUserQueryRow = Prisma.UserGetPayload<{
  select: typeof adminUserSelect;
}>;

export const adminUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  locale: true,
  createdAt: true,
  lastActiveAt: true,
  onboardingCompletedAt: true,
  incomeDayOfMonth: true,
  googleId: true,
  passwordHash: true,
  subscription: {
    select: {
      status: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
    },
  },
  _count: {
    select: {
      accounts: true,
      transactions: true,
      budgets: true,
      goals: true,
      recurring: true,
      sessions: true,
    },
  },
} satisfies Prisma.UserSelect;

export function buildAdminUserView(user: AdminUserQueryRow | null): AdminUserView | null {
  if (!user) {
    return null;
  }

  const view: AdminUserView = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    locale: user.locale,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    onboardingCompletedAt: user.onboardingCompletedAt,
    incomeDayOfMonth: user.incomeDayOfMonth,
    signedInWithGoogle: Boolean(user.googleId),
    hasPassword: Boolean(user.passwordHash),
    subscription: user.subscription
      ? {
          status: user.subscription.status,
          trialEndsAt: user.subscription.trialEndsAt,
          currentPeriodEnd: user.subscription.currentPeriodEnd,
        }
      : null,
    readOnlyMode: user.subscription ? isReadOnlyStatus(user.subscription.status) : false,
    lastLoginAt: user.lastActiveAt,
    counts: {
      activeSessions: user._count?.sessions ?? 0,
      accountCount: user._count?.accounts ?? 0,
      transactionCount: user._count?.transactions ?? 0,
      budgetCount: user._count?.budgets ?? 0,
      goalCount: user._count?.goals ?? 0,
      recurringCount: user._count?.recurring ?? 0,
    },
  };

  const actualKeys = Object.keys(view).sort();
  const expectedKeys = [...ADMIN_USER_ALLOWED_KEYS].sort();
  if (actualKeys.length !== expectedKeys.length || actualKeys.some((key, index) => key !== expectedKeys[index])) {
    throw new Error(
      `Admin user view leaked an unexpected key. Allowed keys: ${expectedKeys.join(", ")}. Actual keys: ${actualKeys.join(", ")}.`,
    );
  }

  return view;
}

export async function getAdminUserById(id: string): Promise<AdminUserView | null> {
  const row = await prisma.user.findUnique({
    where: { id },
    select: adminUserSelect,
  });

  return buildAdminUserView(row);
}
