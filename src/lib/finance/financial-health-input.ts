import { calculateSavingsRate } from "@/lib/finance/savings-rate";
import {
  calculateFinancialHealthScore,
  type BudgetUsageInput,
  type FinancialHealthInput,
  type ScoreComponentKey,
} from "@/lib/finance/financial-health-score";

export type HealthPeriodFlow = {
  year: number;
  month: number;
  income: bigint;
  expenses: bigint;
  essentialExpenses: bigint;
};

export type HealthSnapshotScores = {
  totalScore: number;
  savingsRateScore: number;
  budgetAdherenceScore: number;
  spendingConsistencyScore: number;
  emergencyFundScore: number;
  debtBurdenScore: number;
};

export type HealthSourceData = {
  year: number;
  month: number;
  current: HealthPeriodFlow;
  previous: HealthPeriodFlow | null;
  budgets: BudgetUsageInput[];
  flows: HealthPeriodFlow[];
  reservedMoney: bigint;
  monthlyDebtPayments: bigint;
  previousSnapshot: HealthSnapshotScores | null;
  hasCompletedMonth: boolean;
  /** Live in-progress Jalali month — incomplete, so don't treat it as a closed period. */
  isLiveCurrentPeriod: boolean;
};

export function previousSubScoresFromSnapshot(
  snapshot: HealthSnapshotScores | null,
): FinancialHealthInput["previousSubScores"] {
  if (!snapshot) {
    return undefined;
  }
  return {
    savingsRate: snapshot.savingsRateScore,
    budgetAdherence: snapshot.budgetAdherenceScore,
    spendingConsistency: snapshot.spendingConsistencyScore,
    emergencyFundCoverage: snapshot.emergencyFundScore,
    debtBurden: snapshot.debtBurdenScore,
  };
}

export function spendingHistoryForScore(
  flows: HealthPeriodFlow[],
  options: { excludeIncompleteCurrent: boolean },
): bigint[] {
  const first = flows.findIndex((flow) => periodHasActivity(flow));
  if (first < 0) {
    return [];
  }
  const active = flows.slice(first);
  const closed =
    options.excludeIncompleteCurrent && active.length > 0 ? active.slice(0, -1) : active;
  return closed.map((flow) => flow.expenses);
}

export function assembleFinancialHealthInput(data: HealthSourceData): FinancialHealthInput {
  const previous = data.previous;
  const usingPreviousTotals =
    data.isLiveCurrentPeriod && data.current.income <= 0n && previous != null;
  const scored = usingPreviousTotals ? previous : data.current;
  const priorFlow = usingPreviousTotals
    ? (data.flows[data.flows.length - 3] ?? null)
    : previous;
  const previousRate = priorFlow
    ? calculateSavingsRate(priorFlow.income, priorFlow.expenses)
    : null;
  const essentialFromPrevious = data.previous?.essentialExpenses ?? 0n;
  const monthlyEssentialExpenses =
    essentialFromPrevious > 0n ? essentialFromPrevious : data.current.essentialExpenses;
  const monthlyIncome = scored.income > 0n ? scored.income : (data.previous?.income ?? 0n);

  return {
    income: scored.income,
    expenses: scored.expenses,
    previousPeriodSavingsRate: previousRate,
    budgets: data.budgets,
    monthlySpendingHistory: spendingHistoryForScore(data.flows, {
      excludeIncompleteCurrent: data.isLiveCurrentPeriod,
    }),
    reservedMoney: data.reservedMoney,
    monthlyEssentialExpenses,
    monthlyDebtPayments: data.monthlyDebtPayments,
    monthlyIncome,
    previousSubScores: previousSubScoresFromSnapshot(data.previousSnapshot),
    previousTotalScore: data.previousSnapshot?.totalScore ?? null,
    hasCompletedMonth: data.hasCompletedMonth,
  };
}

export function hasPriorMonthActivity(
  flows: HealthPeriodFlow[],
  year: number,
  month: number,
): boolean {
  return flows.some(
    (flow) =>
      (flow.year < year || (flow.year === year && flow.month < month)) &&
      (flow.income > 0n || flow.expenses > 0n),
  );
}

export function periodHasActivity(flow: HealthPeriodFlow): boolean {
  return flow.income > 0n || flow.expenses > 0n;
}

export function snapshotScoresFromResult(result: {
  totalScore: number | null;
  subScores: { key: ScoreComponentKey; score: number; dataAvailable: boolean }[];
}): HealthSnapshotScores | null {
  if (result.totalScore == null) {
    return null;
  }
  const score = (key: ScoreComponentKey) =>
    result.subScores.find((part) => part.key === key && part.dataAvailable)?.score ?? 0;
  return {
    totalScore: result.totalScore,
    savingsRateScore: score("savingsRate"),
    budgetAdherenceScore: score("budgetAdherence"),
    spendingConsistencyScore: score("spendingConsistency"),
    emergencyFundScore: score("emergencyFundCoverage"),
    debtBurdenScore: score("debtBurden"),
  };
}

export function computeHealthFromSource(data: HealthSourceData) {
  return calculateFinancialHealthScore(assembleFinancialHealthInput(data));
}
