import { toPersianDigits } from "@/lib/currency/format";
import { jalaliFromInstant, jalaliToEpochDay } from "@/lib/dates/tehran";
import type { MonthlyChange } from "@/lib/finance/monthly-change";
import type { PeriodReview } from "@/lib/finance/reports";
import { JALALI_MONTHS, RECAP_FIELD_LABEL } from "@/lib/labels";

export const NEW_MONTH_RECAP_PROMPT_DAYS = 7;

export type RecapFieldId = keyof typeof RECAP_FIELD_LABEL;

export type RecapSelection = {
  fields: RecapFieldId[];
  exactAmounts: boolean;
};

export type RecapGoalStat = {
  name: string;
  pct: number | null;
  contributed: bigint;
};

export type RecapBudgetStat = {
  under: number;
  total: number;
};

export type RecapTopCategory = {
  name: string;
  amount: bigint;
  pct: number;
};

export type MonthlyRecapData = {
  year: number;
  month: number;
  monthLabel: string;
  income: bigint;
  expenses: bigint;
  saved: bigint;
  savingsRate: number | null;
  expenseShareOfIncome: number | null;
  topCategory: RecapTopCategory | null;
  expenseChange: MonthlyChange;
  goal: RecapGoalStat | null;
  daysLogged: number | null;
  daysInPeriod: number;
  budgetsUnder: RecapBudgetStat | null;
};

export type MonthlyRecapDto = {
  year: number;
  month: number;
  monthLabel: string;
  income: string;
  expenses: string;
  saved: string;
  savingsRate: number | null;
  expenseShareOfIncome: number | null;
  topCategory: { name: string; amount: string; pct: number } | null;
  expenseChange: MonthlyChange;
  goal: { name: string; pct: number | null; contributed: string } | null;
  daysLogged: number | null;
  daysInPeriod: number;
  budgetsUnder: RecapBudgetStat | null;
};

export function recapMonthLabel(year: number, month: number): string {
  const name = JALALI_MONTHS[month - 1] ?? "";
  return `${name} ${toPersianDigits(year)}`.trim();
}

export function summarizeLoggedDays(occurredAt: Date[]): {
  daysLogged: number;
  longestStreak: number;
} {
  const unique = [
    ...new Set(occurredAt.map((date) => jalaliToEpochDay(jalaliFromInstant(date)))),
  ].sort((left, right) => left - right);

  if (unique.length === 0) {
    return { daysLogged: 0, longestStreak: 0 };
  }

  let longest = 1;
  let run = 1;
  for (let index = 1; index < unique.length; index += 1) {
    if (unique[index] === unique[index - 1]! + 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  return { daysLogged: unique.length, longestStreak: longest };
}

export function pickMovedGoal(input: {
  goals: { name: string; accountId: string | null; progressPct: number }[];
  inflowsByAccountId: Map<string, bigint>;
  includePct: boolean;
}): RecapGoalStat | null {
  let best: RecapGoalStat | null = null;

  for (const goal of input.goals) {
    if (!goal.accountId) {
      continue;
    }
    const contributed = input.inflowsByAccountId.get(goal.accountId) ?? 0n;
    if (contributed <= 0n) {
      continue;
    }
    if (!best || contributed > best.contributed) {
      best = {
        name: goal.name,
        pct: input.includePct ? goal.progressPct : null,
        contributed,
      };
    }
  }

  return best;
}

export function budgetDiscipline(input: {
  items: { status: "healthy" | "near" | "over" }[];
  overallStatus: "healthy" | "near" | "over" | null;
}): RecapBudgetStat | null {
  if (input.items.length > 0) {
    return {
      under: input.items.filter((item) => item.status !== "over").length,
      total: input.items.length,
    };
  }
  if (input.overallStatus) {
    return {
      under: input.overallStatus === "over" ? 0 : 1,
      total: 1,
    };
  }
  return null;
}

export function assembleMonthlyRecap(input: {
  year: number;
  month: number;
  review: PeriodReview;
  daysLogged: number;
  daysInPeriod: number;
  goal: RecapGoalStat | null;
  budgetsUnder: RecapBudgetStat | null;
}): MonthlyRecapData {
  const expenseShareOfIncome =
    input.review.income > 0n ? Number((input.review.expenses * 100n) / input.review.income) : null;

  return {
    year: input.year,
    month: input.month,
    monthLabel: recapMonthLabel(input.year, input.month),
    income: input.review.income,
    expenses: input.review.expenses,
    saved: input.review.net,
    savingsRate: input.review.savingsRate,
    expenseShareOfIncome,
    topCategory: input.review.topCategory
      ? {
          name: input.review.topCategory.name,
          amount: input.review.topCategory.amount,
          pct: input.review.topCategory.pct,
        }
      : null,
    expenseChange: input.review.expenseChange,
    goal: input.goal,
    daysLogged: input.daysLogged > 0 ? input.daysLogged : null,
    daysInPeriod: input.daysInPeriod,
    budgetsUnder: input.budgetsUnder && input.budgetsUnder.total > 0 ? input.budgetsUnder : null,
  };
}

export function availableRecapFields(data: MonthlyRecapData | MonthlyRecapDto): RecapFieldId[] {
  const income = typeof data.income === "string" ? BigInt(data.income) : data.income;
  const expenses = typeof data.expenses === "string" ? BigInt(data.expenses) : data.expenses;
  const saved = typeof data.saved === "string" ? BigInt(data.saved) : data.saved;
  const fields: RecapFieldId[] = [];

  if (income > 0n) {
    fields.push("income");
  }
  if (expenses > 0n) {
    fields.push("expenses");
  }
  if (income > 0n || saved !== 0n) {
    fields.push("saved");
  }
  if (data.savingsRate != null) {
    fields.push("savingsRate");
  }
  if (data.topCategory) {
    fields.push("topCategory");
  }
  if (data.expenseChange.direction !== "new") {
    fields.push("vsPreviousMonth");
  }
  if (data.goal) {
    fields.push("goalProgress");
  }
  if (data.daysLogged != null && data.daysLogged > 0) {
    fields.push("daysLogged");
  }
  if (data.budgetsUnder && data.budgetsUnder.under > 0) {
    fields.push("budgetsUnder");
  }

  return fields;
}

export function defaultRecapSelection(data: MonthlyRecapData | MonthlyRecapDto): RecapSelection {
  return {
    fields: availableRecapFields(data),
    exactAmounts: false,
  };
}

export function serializeMonthlyRecap(data: MonthlyRecapData): MonthlyRecapDto {
  return {
    year: data.year,
    month: data.month,
    monthLabel: data.monthLabel,
    income: data.income.toString(),
    expenses: data.expenses.toString(),
    saved: data.saved.toString(),
    savingsRate: data.savingsRate,
    expenseShareOfIncome: data.expenseShareOfIncome,
    topCategory: data.topCategory
      ? {
          name: data.topCategory.name,
          amount: data.topCategory.amount.toString(),
          pct: data.topCategory.pct,
        }
      : null,
    expenseChange: data.expenseChange,
    goal: data.goal
      ? {
          name: data.goal.name,
          pct: data.goal.pct,
          contributed: data.goal.contributed.toString(),
        }
      : null,
    daysLogged: data.daysLogged,
    daysInPeriod: data.daysInPeriod,
    budgetsUnder: data.budgetsUnder,
  };
}
