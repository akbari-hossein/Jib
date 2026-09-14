import { calculateSavingsRate } from "@/lib/finance/savings-rate";

export const EMERGENCY_FUND_HISTORY_MONTHS = 6;
export const EMERGENCY_FUND_MIN_HISTORY_MONTHS = 3;
export const EMERGENCY_FUND_TARGET_MONTH_PRESETS = [3, 6, 9] as const;
export const EMERGENCY_FUND_MAX_TARGET_MONTHS = 24;

export type MonthlySpendBucket = {
  month: string;
  totalEssentialSpend: number;
};

export type EmergencyFundProgress = {
  currentAmount: number;
  targetAmount: number;
  remainingAmount: number;
  progressPercent: number;
};

export type MonthsToTarget = {
  months: number | null;
  reason?: "no-savings-data" | "not-saving";
};

export type EssentialSpendTransaction = {
  type: string;
  categoryId: string | null;
  amount: number;
  month: string;
};

export type MonthlyFlowAmounts = {
  income: number;
  expenses: number;
};

export function emergencyFundMonthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Builds one bucket per month in `windowMonths` that has any expense activity.
 * Only expenses whose category is in `essentialCategoryIds` add to the sum.
 * Transactions whose month is outside the window are ignored.
 */
export function buildEssentialMonthlyBuckets(
  transactions: EssentialSpendTransaction[],
  essentialCategoryIds: string[],
  windowMonths: string[],
): MonthlySpendBucket[] {
  const essential = new Set(essentialCategoryIds);
  const window = new Set(windowMonths);
  const totals = new Map<string, number>();
  const activity = new Set<string>();

  for (const transaction of transactions) {
    if (!window.has(transaction.month)) {
      continue;
    }
    if (transaction.type !== "EXPENSE") {
      continue;
    }
    activity.add(transaction.month);
    if (transaction.categoryId && essential.has(transaction.categoryId)) {
      totals.set(
        transaction.month,
        (totals.get(transaction.month) ?? 0) + transaction.amount,
      );
    }
  }

  return windowMonths
    .filter((month) => activity.has(month))
    .map((month) => ({
      month,
      totalEssentialSpend: totals.get(month) ?? 0,
    }));
}

export function calculateEssentialMonthlyAverage(
  buckets: MonthlySpendBucket[],
): { average: number; monthsUsed: number; sufficientData: boolean } {
  const monthsUsed = buckets.length;
  const sufficientData = monthsUsed >= EMERGENCY_FUND_MIN_HISTORY_MONTHS;
  const average =
    monthsUsed === 0
      ? 0
      : buckets.reduce((sum, bucket) => sum + bucket.totalEssentialSpend, 0) / monthsUsed;
  return { average, monthsUsed, sufficientData };
}

export function resolveEssentialMonthlyAverage(input: {
  buckets: MonthlySpendBucket[];
  estimatedMonthlyEssential: number | null;
}): {
  average: number;
  monthsUsed: number;
  sufficientData: boolean;
  usingEstimate: boolean;
} {
  const computed = calculateEssentialMonthlyAverage(input.buckets);
  const estimate = input.estimatedMonthlyEssential;
  if (!computed.sufficientData && estimate != null && estimate > 0) {
    return {
      average: estimate,
      monthsUsed: computed.monthsUsed,
      sufficientData: false,
      usingEstimate: true,
    };
  }
  return { ...computed, usingEstimate: false };
}

export function calculateEmergencyFundTarget(
  essentialMonthlyAverage: number,
  targetMonths: number,
): number {
  return Math.round(essentialMonthlyAverage * targetMonths);
}

export function calculateEmergencyFundProgress(
  currentAmount: number,
  targetAmount: number,
): EmergencyFundProgress {
  const remainingAmount = Math.max(targetAmount - currentAmount, 0);
  const progressPercent =
    targetAmount === 0 ? 0 : Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  return { currentAmount, targetAmount, remainingAmount, progressPercent };
}

/**
 * Combines remaining amount with average monthly savings.
 * Average monthly savings is derived from `calculateSavingsRate` over monthly flows
 * via {@link averageMonthlySavingsFromFlows} — this function does not recompute it.
 */
export function calculateMonthsToTarget(
  remainingAmount: number,
  averageMonthlySavings: number | null | undefined,
): MonthsToTarget {
  if (averageMonthlySavings === null || averageMonthlySavings === undefined) {
    return { months: null, reason: "no-savings-data" };
  }
  if (averageMonthlySavings <= 0) {
    return { months: null, reason: "not-saving" };
  }
  return { months: Math.ceil(remainingAmount / averageMonthlySavings) };
}

/** Average of (income − expenses) per month, using `calculateSavingsRate` to detect missing income. */
export function averageMonthlySavingsFromFlows(flows: MonthlyFlowAmounts[]): number | null {
  if (flows.length === 0) {
    return null;
  }
  const income = Math.round(flows.reduce((sum, flow) => sum + flow.income, 0));
  const expenses = Math.round(flows.reduce((sum, flow) => sum + flow.expenses, 0));
  const rate = calculateSavingsRate(BigInt(income), BigInt(expenses));
  if (rate == null) {
    return null;
  }
  return (income - expenses) / flows.length;
}

export type CategoryMonthTotal = {
  categoryId: string;
  month: string;
  amount: number;
};

export function assembleEmergencyFund(input: {
  currentAmount: number;
  targetMonths: number;
  essentialCategoryIds: string[];
  estimatedMonthlyEssential: number | null;
  categoryMonthTotals: CategoryMonthTotal[];
  windowMonths: string[];
  monthlyFlows: MonthlyFlowAmounts[];
}): {
  monthsUsed: number;
  sufficientData: boolean;
  usingEstimate: boolean;
  average: number;
  targetAmount: number;
  progress: EmergencyFundProgress;
  forecast: MonthsToTarget;
} {
  const buckets = buildEssentialMonthlyBuckets(
    input.categoryMonthTotals.map((row) => ({
      type: "EXPENSE",
      categoryId: row.categoryId,
      amount: row.amount,
      month: row.month,
    })),
    input.essentialCategoryIds,
    input.windowMonths,
  );
  const resolved = resolveEssentialMonthlyAverage({
    buckets,
    estimatedMonthlyEssential: input.estimatedMonthlyEssential,
  });
  const targetAmount = calculateEmergencyFundTarget(
    resolved.average,
    Math.max(0, input.targetMonths),
  );
  const progress = calculateEmergencyFundProgress(input.currentAmount, targetAmount);
  const averageMonthlySavings = averageMonthlySavingsFromFlows(input.monthlyFlows);
  return {
    monthsUsed: resolved.monthsUsed,
    sufficientData: resolved.sufficientData,
    usingEstimate: resolved.usingEstimate,
    average: resolved.average,
    targetAmount,
    progress,
    forecast: calculateMonthsToTarget(progress.remainingAmount, averageMonthlySavings),
  };
}
