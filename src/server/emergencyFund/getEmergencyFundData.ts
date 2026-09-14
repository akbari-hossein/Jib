import type { CategoryGroup, CategoryKind } from "@prisma/client";
import {
  addJalaliMonths,
  getTehranJalaliDate,
  jalaliFromInstant,
  tehranMidnightUtc,
} from "@/lib/dates/tehran";
import {
  EMERGENCY_FUND_HISTORY_MONTHS,
  assembleEmergencyFund,
  emergencyFundMonthKey,
  type EmergencyFundProgress,
  type MonthsToTarget,
} from "@/lib/finance/emergencyFund";
import { listChartMonthWindow } from "@/lib/finance/report-charts";
import { prisma } from "@/lib/db/prisma";

export const EMERGENCY_FUND_GOAL_NAME = "صندوق اضطراری";

export type EmergencyFundCategory = {
  id: string;
  name: string;
  icon: string;
  group: CategoryGroup;
  kind: CategoryKind;
};

export type CategoryMonthTotal = {
  categoryId: string;
  month: string;
  amount: number;
};

export type EmergencyFundMonthlyFlow = {
  month: string;
  income: number;
  expenses: number;
};

export type EmergencyFundSnapshot = {
  id: string;
  currentAmount: number;
  targetAmount: number;
  targetMonths: number;
  essentialCategoryIds: string[];
  estimatedMonthlyEssential: number | null;
};

export type EmergencyFundData = {
  configured: boolean;
  goal: EmergencyFundSnapshot | null;
  categories: EmergencyFundCategory[];
  defaultEssentialCategoryIds: string[];
  selectedCategories: EmergencyFundCategory[];
  categoryMonthTotals: CategoryMonthTotal[];
  activityMonths: string[];
  windowMonths: string[];
  monthlyFlows: EmergencyFundMonthlyFlow[];
  monthsUsed: number;
  sufficientData: boolean;
  usingEstimate: boolean;
  average: number;
  progress: EmergencyFundProgress;
  forecast: MonthsToTarget;
};

function toAmount(value: bigint): number {
  return Number(value);
}

export async function getEmergencyFundData(
  userId: string,
  now = new Date(),
): Promise<EmergencyFundData> {
  const today = getTehranJalaliDate(now);
  const months = listChartMonthWindow(
    { year: today.year, month: today.month },
    EMERGENCY_FUND_HISTORY_MONTHS,
  );
  const windowMonths = months.map((month) => emergencyFundMonthKey(month.year, month.month));
  const from = tehranMidnightUtc({ ...months[0]!, day: 1 });
  const next = addJalaliMonths({ year: today.year, month: today.month, day: 1 }, 1);
  const to = tehranMidnightUtc(next);

  const [goal, categories, transactions] = await Promise.all([
    prisma.goal.findFirst({
      where: { userId, type: "EMERGENCY_FUND", isArchived: false },
      include: { account: { select: { balance: true } } },
    }),
    prisma.category.findMany({
      where: { userId, kind: { in: ["EXPENSE", "BOTH"] } },
      orderBy: [{ group: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true, icon: true, group: true, kind: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: { in: ["INCOME", "EXPENSE"] },
        occurredAt: { gte: from, lt: to },
      },
      select: {
        type: true,
        amount: true,
        categoryId: true,
        occurredAt: true,
      },
    }),
  ]);

  const defaultEssentialCategoryIds = categories
    .filter((category) => category.group === "ESSENTIAL")
    .map((category) => category.id);

  const categoryMonthTotalsMap = new Map<string, CategoryMonthTotal>();
  const activity = new Set<string>();
  const flowTotals = new Map<string, EmergencyFundMonthlyFlow>(
    windowMonths.map((month) => [month, { month, income: 0, expenses: 0 }]),
  );

  for (const row of transactions) {
    const jalali = jalaliFromInstant(row.occurredAt);
    const month = emergencyFundMonthKey(jalali.year, jalali.month);
    const flow = flowTotals.get(month);
    if (!flow) {
      continue;
    }
    const amount = toAmount(row.amount);
    if (row.type === "INCOME") {
      flow.income += amount;
      continue;
    }
    flow.expenses += amount;
    activity.add(month);
    if (!row.categoryId) {
      continue;
    }
    const key = `${row.categoryId}:${month}`;
    const existing = categoryMonthTotalsMap.get(key);
    if (existing) {
      existing.amount += amount;
    } else {
      categoryMonthTotalsMap.set(key, { categoryId: row.categoryId, month, amount });
    }
  }

  const categoryMonthTotals = [...categoryMonthTotalsMap.values()];
  const activityMonths = windowMonths.filter((month) => activity.has(month));
  const monthlyFlows = windowMonths
    .map((month) => flowTotals.get(month)!)
    .filter((flow) => flow.income > 0 || flow.expenses > 0);

  const essentialCategoryIds = goal?.essentialCategoryIds.length
    ? goal.essentialCategoryIds
    : defaultEssentialCategoryIds;
  const currentAmount = goal
    ? toAmount(goal.account ? goal.account.balance : goal.currentAmount)
    : 0;
  const targetMonths = goal?.targetMonths ?? 0;
  const estimatedMonthlyEssential =
    goal?.estimatedMonthlyEssential == null ? null : toAmount(goal.estimatedMonthlyEssential);

  const snapshot = assembleEmergencyFund({
    currentAmount,
    targetMonths,
    essentialCategoryIds,
    estimatedMonthlyEssential,
    categoryMonthTotals,
    windowMonths,
    monthlyFlows,
  });

  const selectedCategories = categories.filter((category) =>
    essentialCategoryIds.includes(category.id),
  );

  return {
    configured: goal != null,
    goal: goal
      ? {
          id: goal.id,
          currentAmount,
          targetAmount: snapshot.targetAmount,
          targetMonths,
          essentialCategoryIds,
          estimatedMonthlyEssential,
        }
      : null,
    categories,
    defaultEssentialCategoryIds,
    selectedCategories,
    categoryMonthTotals,
    activityMonths,
    windowMonths,
    monthlyFlows,
    monthsUsed: snapshot.monthsUsed,
    sufficientData: snapshot.sufficientData,
    usingEstimate: snapshot.usingEstimate,
    average: snapshot.average,
    progress: snapshot.progress,
    forecast: snapshot.forecast,
  };
}
