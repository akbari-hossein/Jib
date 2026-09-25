import type { SubscriptionStatus, UserRole, UserStatus } from "@prisma/client";

export const ADMIN_USER_ALLOWED_KEYS = [
  "id",
  "email",
  "name",
  "role",
  "status",
  "locale",
  "createdAt",
  "lastActiveAt",
  "onboardingCompletedAt",
  "incomeDayOfMonth",
  "signedInWithGoogle",
  "hasPassword",
  "subscription",
  "readOnlyMode",
  "lastLoginAt",
  "counts",
] as const;

export const ADMIN_USER_FORBIDDEN_KEYS = [
  "transactions",
  "accounts",
  "budgets",
  "budgetCategories",
  "goals",
  "recurringTransactions",
  "totalBalance",
  "monthlyIncome",
  "monthlyExpense",
  "monthlySaved",
  "recentTransactions",
] as const;

export type AdminUserSubscriptionView = {
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
};

export type AdminUserCountsView = {
  activeSessions: number;
  accountCount: number;
  transactionCount: number;
  budgetCount: number;
  goalCount: number;
  recurringCount: number;
};

export type AdminUserView = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  locale: string | null;
  createdAt: Date;
  lastActiveAt: Date | null;
  onboardingCompletedAt: Date | null;
  incomeDayOfMonth: number | null;
  signedInWithGoogle: boolean;
  hasPassword: boolean;
  subscription: AdminUserSubscriptionView | null;
  readOnlyMode: boolean;
  lastLoginAt: Date | null;
  counts: AdminUserCountsView;
};
