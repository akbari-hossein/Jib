import { calculateSavingsRate } from "@/lib/finance/savings-rate";
import {
  SCORE_COMPONENT_LABEL,
  emergencyFundExplanation,
  formatScoreExplanation,
  missingScoreExplanation,
  savingsRateExplanation,
  budgetAdherenceExplanation,
  spendingConsistencyExplanation,
  debtBurdenExplanation,
  type ScoreTrend,
} from "@/lib/finance/financial-health-copy";

export const SCORE_WEIGHTS = {
  savingsRate: 0.3,
  budgetAdherence: 0.25,
  spendingConsistency: 0.2,
  emergencyFundCoverage: 0.15,
  debtBurden: 0.1,
} as const;

export type ScoreComponentKey = keyof typeof SCORE_WEIGHTS;

export const SCORE_COMPONENT_KEYS = [
  "savingsRate",
  "budgetAdherence",
  "spendingConsistency",
  "emergencyFundCoverage",
  "debtBurden",
] as const satisfies readonly ScoreComponentKey[];

/** Savings rate that maps to a component score of 100. */
export const SAVINGS_RATE_TARGET_PCT = 20;

/** Months of essential expenses that map to an emergency-fund score of 100. */
export const EMERGENCY_FUND_TARGET_MONTHS = 3;

/** Coefficient of variation at which spending-consistency score reaches 0. */
export const SPENDING_CV_ZERO_SCORE = 0.6;

/** Minimum calendar months of spending history required to score consistency. */
export const SPENDING_CONSISTENCY_MIN_MONTHS = 3;

/** Maximum months included in the consistency window. */
export const SPENDING_CONSISTENCY_MAX_MONTHS = 6;

/** Debt-to-income percent that maps to a debt-burden score of 0. */
export const DEBT_BURDEN_ZERO_SCORE_PCT = 40;

export type BudgetUsageInput = {
  spent: bigint;
  limit: bigint;
};

export type SubScoreResult = {
  key: ScoreComponentKey;
  score: number;
  label: string;
  explanation: string;
  dataAvailable: boolean;
  rawValue?: number;
  trend?: ScoreTrend;
  previousValue?: number;
  previousScore?: number;
};

export type FinancialHealthInput = {
  income: bigint;
  expenses: bigint;
  previousPeriodSavingsRate?: number | null;
  budgets: BudgetUsageInput[];
  monthlySpendingHistory: bigint[];
  reservedMoney: bigint;
  monthlyEssentialExpenses: bigint;
  monthlyDebtPayments: bigint;
  monthlyIncome: bigint;
  previousSubScores?: Partial<Record<ScoreComponentKey, number>>;
  previousTotalScore?: number | null;
  /** False until the user has at least one closed Jalali month with activity. */
  hasCompletedMonth: boolean;
};

export type FinancialHealthResult = {
  ready: boolean;
  totalScore: number | null;
  subScores: SubScoreResult[];
  primaryDriver: ScoreComponentKey | null;
  explanation: string;
  trend: ScoreTrend;
  scoreDelta: number | null;
};

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function trendFromValues(current: number, previous: number | undefined): ScoreTrend | undefined {
  if (previous == null) {
    return undefined;
  }
  if (current === previous) {
    return "flat";
  }
  return current > previous ? "up" : "down";
}

/**
 * Maps savings rate to 0–100.
 * Formula: score = clamp(ratePct / SAVINGS_RATE_TARGET_PCT * 100).
 * Negative or zero savings → 0. 20%+ → 100.
 * No income → not scored (missing data, not a zero).
 */
export function calculateSavingsRateScore(
  income: bigint,
  expenses: bigint,
  previousPeriodSavingsRate?: number | null,
): SubScoreResult {
  const label = SCORE_COMPONENT_LABEL.savingsRate;
  const rate = calculateSavingsRate(income, expenses);
  if (rate == null) {
    return {
      key: "savingsRate",
      score: 0,
      label,
      explanation: missingScoreExplanation("savingsRate"),
      dataAvailable: false,
    };
  }

  const previousValue =
    previousPeriodSavingsRate == null ? undefined : previousPeriodSavingsRate;
  const score = clampScore((rate / SAVINGS_RATE_TARGET_PCT) * 100);

  return {
    key: "savingsRate",
    score,
    label,
    explanation: savingsRateExplanation(rate, previousValue),
    dataAvailable: true,
    rawValue: rate,
    trend: trendFromValues(rate, previousValue),
    previousValue,
  };
}

/**
 * Size-weighted budget adherence.
 * Each budget scores 100 while spent ≤ limit, then loses one point per
 * percent over the limit (200% spent → 0). The combined score is
 * sum(adherence_i * limit_i) / sum(limit_i) — not a simple average of percents.
 * No positive limits → not scored.
 */
export function calculateBudgetAdherenceScore(budgets: BudgetUsageInput[]): SubScoreResult {
  const label = SCORE_COMPONENT_LABEL.budgetAdherence;
  let weighted = 0n;
  let totalLimit = 0n;

  for (const budget of budgets) {
    if (budget.limit <= 0n) {
      continue;
    }
    const adherence = BigInt(budgetAdherenceFor(budget.spent, budget.limit));
    weighted += adherence * budget.limit;
    totalLimit += budget.limit;
  }

  if (totalLimit <= 0n) {
    return {
      key: "budgetAdherence",
      score: 0,
      label,
      explanation: missingScoreExplanation("budgetAdherence"),
      dataAvailable: false,
    };
  }

  const score = clampScore(Number(weighted / totalLimit));
  return {
    key: "budgetAdherence",
    score,
    label,
    explanation: budgetAdherenceExplanation(score),
    dataAvailable: true,
    rawValue: score,
  };
}

function budgetAdherenceFor(spent: bigint, limit: bigint): number {
  if (spent <= limit) {
    return 100;
  }
  const overPct = Number(((spent - limit) * 100n) / limit);
  return clampScore(100 - overPct);
}

/**
 * Spending stability from coefficient of variation across the last 3–6 months.
 * Formula: CV = stddev / mean; score = clamp(100 * (1 - CV / SPENDING_CV_ZERO_SCORE)).
 * Lower variance → higher score. Fewer than 3 months, or a non-positive mean → not scored.
 */
export function calculateSpendingConsistencyScore(
  monthlySpendingHistory: bigint[],
): SubScoreResult {
  const label = SCORE_COMPONENT_LABEL.spendingConsistency;
  const firstActive = monthlySpendingHistory.findIndex((amount) => amount > 0n);
  const active = firstActive < 0 ? [] : monthlySpendingHistory.slice(firstActive);
  const window = active.slice(-SPENDING_CONSISTENCY_MAX_MONTHS);
  const cv = coefficientOfVariation(window.map((amount) => Number(amount)));

  if (window.length < SPENDING_CONSISTENCY_MIN_MONTHS || cv == null) {
    return {
      key: "spendingConsistency",
      score: 0,
      label,
      explanation: missingScoreExplanation("spendingConsistency"),
      dataAvailable: false,
    };
  }

  const score = clampScore(100 * (1 - cv / SPENDING_CV_ZERO_SCORE));
  return {
    key: "spendingConsistency",
    score,
    label,
    explanation: spendingConsistencyExplanation(score),
    dataAvailable: true,
    rawValue: Math.round(cv * 100),
  };
}

function coefficientOfVariation(values: number[]): number | null {
  if (values.length < SPENDING_CONSISTENCY_MIN_MONTHS) {
    return null;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (mean <= 0) {
    return null;
  }
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/**
 * Emergency-fund coverage as months of essential expenses held in reserved money.
 * progress = min(1, months / 3); score = round(100 * (2p - p²)) — ease-out curve
 * so 0 months = 0, 1.5 months ≈ 75, 3+ months = 100.
 * No essential-expense baseline → not scored.
 */
export function calculateEmergencyFundScore(
  reservedMoney: bigint,
  monthlyEssentialExpenses: bigint,
): SubScoreResult {
  const label = SCORE_COMPONENT_LABEL.emergencyFundCoverage;
  if (monthlyEssentialExpenses <= 0n) {
    return {
      key: "emergencyFundCoverage",
      score: 0,
      label,
      explanation: missingScoreExplanation("emergencyFundCoverage"),
      dataAvailable: false,
    };
  }

  const months = Number(reservedMoney) / Number(monthlyEssentialExpenses);
  const coverageMonths = Math.max(0, months);
  const progress = Math.min(1, coverageMonths / EMERGENCY_FUND_TARGET_MONTHS);
  const score = clampScore(100 * (2 * progress - progress * progress));

  return {
    key: "emergencyFundCoverage",
    score,
    label,
    explanation: emergencyFundExplanation(coverageMonths),
    dataAvailable: true,
    rawValue: Math.round(coverageMonths * 10) / 10,
  };
}

/**
 * Inverse debt-to-income score.
 * DTI% = payments / income * 100; score = clamp(100 - DTI% * 100 / 40).
 * 0% of income → 100; 40%+ → 0. No income → not scored (not a zero).
 * Zero payments with income is a real 100, not missing data.
 */
export function calculateDebtBurdenScore(
  monthlyDebtPayments: bigint,
  monthlyIncome: bigint,
): SubScoreResult {
  const label = SCORE_COMPONENT_LABEL.debtBurden;
  if (monthlyIncome <= 0n) {
    return {
      key: "debtBurden",
      score: 0,
      label,
      explanation: missingScoreExplanation("debtBurden"),
      dataAvailable: false,
    };
  }

  const payments = monthlyDebtPayments < 0n ? 0n : monthlyDebtPayments;
  const dtiPct = Number((payments * 100n) / monthlyIncome);
  const score = clampScore(100 - (dtiPct * 100) / DEBT_BURDEN_ZERO_SCORE_PCT);

  return {
    key: "debtBurden",
    score,
    label,
    explanation: debtBurdenExplanation(dtiPct),
    dataAvailable: true,
    rawValue: dtiPct,
  };
}

export function combineWeightedScores(
  parts: readonly Pick<SubScoreResult, "key" | "score" | "dataAvailable">[],
  weights: typeof SCORE_WEIGHTS = SCORE_WEIGHTS,
): { totalScore: number | null; usedKeys: ScoreComponentKey[] } {
  const available = parts.filter((part) => part.dataAvailable);
  const weightSum = available.reduce((sum, part) => sum + weights[part.key], 0);
  if (weightSum <= 0) {
    return { totalScore: null, usedKeys: [] };
  }

  const mixed =
    available.reduce((sum, part) => sum + part.score * weights[part.key], 0) / weightSum;
  return {
    totalScore: clampScore(mixed),
    usedKeys: available.map((part) => part.key),
  };
}

export function pickPrimaryDriver(
  parts: readonly Pick<SubScoreResult, "key" | "score" | "dataAvailable">[],
  previousSubScores?: Partial<Record<ScoreComponentKey, number>>,
): ScoreComponentKey | null {
  const available = parts.filter((part) => part.dataAvailable);
  if (available.length === 0) {
    return null;
  }

  let best = available[0]!;
  let bestDelta = -1;
  let sawPrevious = false;

  for (const part of available) {
    const previous = previousSubScores?.[part.key];
    if (previous == null) {
      continue;
    }
    sawPrevious = true;
    const delta = Math.abs(part.score - previous);
    if (delta > bestDelta) {
      bestDelta = delta;
      best = part;
    }
  }

  if (!sawPrevious || bestDelta <= 0) {
    return available.reduce((winner, part) => (part.score > winner.score ? part : winner)).key;
  }

  return best.key;
}

function attachPreviousScores(
  parts: SubScoreResult[],
  previousSubScores?: Partial<Record<ScoreComponentKey, number>>,
): SubScoreResult[] {
  return parts.map((part) => {
    const previousScore = previousSubScores?.[part.key];
    if (previousScore == null || !part.dataAvailable) {
      return part;
    }
    return {
      ...part,
      previousScore,
      trend: part.trend ?? trendFromValues(part.score, previousScore),
    };
  });
}

export function calculateFinancialHealthScore(input: FinancialHealthInput): FinancialHealthResult {
  const computed = attachPreviousScores(
    [
      calculateSavingsRateScore(input.income, input.expenses, input.previousPeriodSavingsRate),
      calculateBudgetAdherenceScore(input.budgets),
      calculateSpendingConsistencyScore(input.monthlySpendingHistory),
      calculateEmergencyFundScore(input.reservedMoney, input.monthlyEssentialExpenses),
      calculateDebtBurdenScore(input.monthlyDebtPayments, input.monthlyIncome),
    ],
    input.previousSubScores,
  );

  if (!input.hasCompletedMonth) {
    return {
      ready: false,
      totalScore: null,
      subScores: computed,
      primaryDriver: null,
      explanation: formatScoreExplanation({ kind: "empty" }),
      trend: "new",
      scoreDelta: null,
    };
  }

  const combined = combineWeightedScores(computed);
  if (combined.totalScore == null) {
    return {
      ready: false,
      totalScore: null,
      subScores: computed,
      primaryDriver: null,
      explanation: formatScoreExplanation({ kind: "empty" }),
      trend: "new",
      scoreDelta: null,
    };
  }

  const previousTotal =
    input.previousTotalScore == null ? null : input.previousTotalScore;
  const scoreDelta = previousTotal == null ? null : combined.totalScore - previousTotal;
  const trend: ScoreTrend =
    scoreDelta == null ? "new" : scoreDelta === 0 ? "flat" : scoreDelta > 0 ? "up" : "down";
  const primaryDriver = pickPrimaryDriver(computed, input.previousSubScores);
  const driver = computed.find((part) => part.key === primaryDriver) ?? null;

  return {
    ready: true,
    totalScore: combined.totalScore,
    subScores: computed,
    primaryDriver,
    explanation: formatScoreExplanation({
      kind: "hero",
      totalScore: combined.totalScore,
      previousTotalScore: previousTotal,
      trend,
      scoreDelta,
      driver,
    }),
    trend,
    scoreDelta,
  };
}

/** Convert a recurring amount into a monthly Toman equivalent. */
export function monthlyEquivalentAmount(
  amount: bigint,
  frequency: "WEEKLY" | "MONTHLY" | "YEARLY",
  interval = 1,
): bigint {
  const step = BigInt(Math.max(1, interval));
  if (amount <= 0n) {
    return 0n;
  }
  if (frequency === "MONTHLY") {
    return amount / step;
  }
  if (frequency === "WEEKLY") {
    return (amount * 30n) / (7n * step);
  }
  return amount / (12n * step);
}
