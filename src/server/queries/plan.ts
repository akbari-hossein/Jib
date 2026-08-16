import type { Plan } from "@prisma/client";
import { canCreate, canSelfServePro, hasFeature, isPro } from "@/lib/billing/plan";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { prisma } from "@/lib/db/prisma";

export async function getPlanAccess(userId: string, plan: Plan) {
  const today = getTehranJalaliDate();
  const [activeAccounts, activeGoals, budgetCategories] = await Promise.all([
    prisma.account.count({ where: { userId, isActive: true } }),
    prisma.goal.count({ where: { userId, isArchived: false } }),
    prisma.budgetCategory.count({
      where: {
        budget: { userId, jalaliYear: today.year, jalaliMonth: today.month },
      },
    }),
  ]);

  return {
    plan,
    isPro: isPro(plan),
    canCreateAccount: canCreate(plan, "accounts", activeAccounts),
    canCreateGoal: canCreate(plan, "goals", activeGoals),
    canCreateBudgetCategory: canCreate(plan, "budgetCategories", budgetCategories),
    canUseRecurring: hasFeature(plan, "recurring"),
    canExport: hasFeature(plan, "export"),
    canSetOverallBudget: hasFeature(plan, "overallBudget"),
    canSelfServe: canSelfServePro(),
  };
}

export type PlanAccess = Awaited<ReturnType<typeof getPlanAccess>>;
