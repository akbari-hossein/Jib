import type { TransactionType } from "@prisma/client";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { jalaliToEpochDay, type JalaliDate } from "@/lib/dates/tehran";
import type { NotificationRuleKey } from "@/lib/notifications/catalog";

export const BUDGET_THRESHOLDS = [75, 90, 100] as const;
export type BudgetThreshold = (typeof BUDGET_THRESHOLDS)[number];

export const GOAL_MILESTONES = [25, 50, 75, 100] as const;
export type GoalMilestone = (typeof GOAL_MILESTONES)[number];

export const RECURRING_REMINDER_DAYS = [3, 1] as const;
export type RecurringReminderDay = (typeof RECURRING_REMINDER_DAYS)[number];

export const DEFAULT_DAILY_LOGGER_WINDOW_DAYS = 7;
export const DEFAULT_DAILY_LOGGER_MIN_DAYS = 5;
export const DEFAULT_EVENING_HOUR = 20;
export const DEFAULT_DAILY_ALLOWANCE_HOUR = 9;
export const DEFAULT_PACE_THRESHOLD_PCT = 25;
export const JALALI_WEEK_LENGTH = 7;

export type FinanceNotification = {
  ruleKey: NotificationRuleKey;
  title: string;
  body: string;
  href: string;
  dedupeKey: string;
  explanation: string;
  payload: Record<string, string | number | boolean>;
};

export type NoTransactionTodayInput = {
  hasLoggedToday: boolean;
  activeDaysInWindow: number;
  windowDays?: number;
  minActiveDays?: number;
  currentHour: number;
  eveningHour?: number;
  dateKey: string;
};

export type BudgetThresholdInput = {
  budgetId: string;
  name: string;
  spent: bigint;
  limit: bigint;
  period: string;
};

export type RecurringExpenseInput = {
  id: string;
  name: string;
  amount: bigint;
  type: TransactionType;
  nextRunAt: JalaliDate;
  today: JalaliDate;
};

export type SpendingPaceInput = {
  currentWeekSpendToDate: bigint;
  lastWeekTotal: bigint;
  daysElapsed: number;
  weekKey: string;
  thresholdPct?: number;
};

export type DailyAllowanceStatusInput = {
  remainingToday: bigint;
  currentHour: number;
  sendHour?: number;
  dateKey: string;
};

export type GoalMilestoneInput = {
  id: string;
  name: string;
  currentAmount: bigint;
  targetAmount: bigint;
};

function highestAtLeast<T extends number>(value: number, steps: readonly T[]): T | null {
  let matched: T | null = null;
  for (const step of steps) {
    if (value >= step) {
      matched = step;
    }
  }
  return matched;
}

function integerPercent(numerator: bigint, denominator: bigint): number {
  if (denominator <= 0n) {
    return 0;
  }
  return Number((numerator * 100n) / denominator);
}

export function checkNoTransactionToday(user: NoTransactionTodayInput): FinanceNotification | null {
  if (user.hasLoggedToday) {
    return null;
  }

  const windowDays = user.windowDays ?? DEFAULT_DAILY_LOGGER_WINDOW_DAYS;
  const minActiveDays = user.minActiveDays ?? DEFAULT_DAILY_LOGGER_MIN_DAYS;
  if (user.activeDaysInWindow < minActiveDays) {
    return null;
  }

  const eveningHour = user.eveningHour ?? DEFAULT_EVENING_HOUR;
  if (user.currentHour < eveningHour) {
    return null;
  }

  return {
    ruleKey: "NO_TRANSACTION_TODAY",
    title: "یادآوری ثبت تراکنش",
    body: "امروز هنوز تراکنشی ثبت نکردی. یه نگاه سریع بنداز؟",
    href: "/transactions",
    dedupeKey: user.dateKey,
    explanation: `در ${toPersianDigits(windowDays)} روز اخیر، ${toPersianDigits(user.activeDaysInWindow)} روز تراکنش داشتی و تا ساعت ${toPersianDigits(eveningHour)} امروز چیزی ثبت نشده.`,
    payload: {
      dateKey: user.dateKey,
      activeDaysInWindow: user.activeDaysInWindow,
      eveningHour,
    },
  };
}

export function crossedBudgetThreshold(spent: bigint, limit: bigint): BudgetThreshold | null {
  const pct = integerPercent(spent, limit);
  return highestAtLeast(pct, BUDGET_THRESHOLDS);
}

export function checkBudgetThreshold(budget: BudgetThresholdInput): FinanceNotification | null {
  const threshold = crossedBudgetThreshold(budget.spent, budget.limit);
  if (threshold == null) {
    return null;
  }

  const pct = integerPercent(budget.spent, budget.limit);
  return {
    ruleKey: "BUDGET_THRESHOLD",
    title: "بودجه",
    body: `${toPersianDigits(pct)}٪ از بودجه‌ی «${budget.name}» رو مصرف کردی.`,
    href: `/budgets#budget-${budget.budgetId}`,
    dedupeKey: `${budget.budgetId}:${threshold}:${budget.period}`,
    explanation: `خرج این دوره ${formatToman(budget.spent)} از سقف ${formatToman(budget.limit)} است (${toPersianDigits(pct)}٪). این یادآوری برای آستانه ${toPersianDigits(threshold)}٪ است و در همین ماه تکرار نمی‌شود.`,
    payload: {
      budgetId: budget.budgetId,
      name: budget.name,
      period: budget.period,
      threshold,
      pct,
    },
  };
}

export function daysUntilJalali(from: JalaliDate, to: JalaliDate): number {
  return jalaliToEpochDay(to) - jalaliToEpochDay(from);
}

export function checkUpcomingRecurringExpense(
  recurringTransaction: RecurringExpenseInput,
): FinanceNotification | null {
  if (recurringTransaction.type !== "EXPENSE") {
    return null;
  }

  const daysUntil = daysUntilJalali(recurringTransaction.today, recurringTransaction.nextRunAt);
  if (!(RECURRING_REMINDER_DAYS as readonly number[]).includes(daysUntil)) {
    return null;
  }

  const daysLabel = daysUntil === 1 ? "۱ روز" : `${toPersianDigits(daysUntil)} روز`;
  const dueKey = `${recurringTransaction.nextRunAt.year}-${String(recurringTransaction.nextRunAt.month).padStart(2, "0")}-${String(recurringTransaction.nextRunAt.day).padStart(2, "0")}`;

  return {
    ruleKey: "UPCOMING_RECURRING",
    title: "خرج نزدیک",
    body: `${recurringTransaction.name} ${daysLabel} دیگه سررسیده (${formatCompactToman(recurringTransaction.amount)}).`,
    href: `/recurring#recurring-${recurringTransaction.id}`,
    dedupeKey: `${recurringTransaction.id}:${daysUntil}:${dueKey}`,
    explanation: `موعد «${recurringTransaction.name}» ${daysLabel} دیگر است و مبلغ ${formatToman(recurringTransaction.amount)} از خرج‌های تکراری تو خوانده شده.`,
    payload: {
      recurringId: recurringTransaction.id,
      name: recurringTransaction.name,
      daysUntil,
      dueKey,
    },
  };
}

export function projectWeekSpend(spendToDate: bigint, daysElapsed: number): bigint {
  const days = Math.max(1, Math.min(JALALI_WEEK_LENGTH, Math.trunc(daysElapsed)));
  return (spendToDate * BigInt(JALALI_WEEK_LENGTH)) / BigInt(days);
}

export function checkSpendingPaceAnomaly(weeklyStats: SpendingPaceInput): FinanceNotification | null {
  if (weeklyStats.currentWeekSpendToDate <= 0n || weeklyStats.lastWeekTotal <= 0n) {
    return null;
  }

  const daysElapsed = Math.max(1, Math.min(JALALI_WEEK_LENGTH, Math.trunc(weeklyStats.daysElapsed)));
  const projected = projectWeekSpend(weeklyStats.currentWeekSpendToDate, daysElapsed);
  const thresholdPct = weeklyStats.thresholdPct ?? DEFAULT_PACE_THRESHOLD_PCT;
  const ceiling = (weeklyStats.lastWeekTotal * BigInt(100 + thresholdPct)) / 100n;

  if (projected <= ceiling) {
    return null;
  }

  const projectedPctOverLast = integerPercent(projected - weeklyStats.lastWeekTotal, weeklyStats.lastWeekTotal);

  return {
    ruleKey: "SPENDING_PACE_ANOMALY",
    title: "سرعت خرج",
    body: "این هفته سریع‌تر از هفته‌ی قبل داری خرج می‌کنی.",
    href: "/reports#week",
    dedupeKey: `week:${weeklyStats.weekKey}`,
    explanation: [
      `خرج این هفته تا الان: ${formatToman(weeklyStats.currentWeekSpendToDate)}`,
      `روزهای سپری‌شده از شنبه: ${toPersianDigits(daysElapsed)} از ${toPersianDigits(JALALI_WEEK_LENGTH)}`,
      `برآورد خطی تا جمعه: ${formatToman(weeklyStats.currentWeekSpendToDate)} × ${toPersianDigits(JALALI_WEEK_LENGTH)} ÷ ${toPersianDigits(daysElapsed)} = ${formatToman(projected)}`,
      `خرج هفته قبل: ${formatToman(weeklyStats.lastWeekTotal)}`,
      `آستانه: ${toPersianDigits(thresholdPct)}٪ بیشتر از هفته قبل = ${formatToman(ceiling)}`,
      `برآورد حدود ${toPersianDigits(projectedPctOverLast)}٪ از هفته قبل بیشتر است. این یک مدل پیش‌بینی نیست؛ فقط ضرب و تقسیم خطی است.`,
    ].join("\n"),
    payload: {
      weekKey: weeklyStats.weekKey,
      daysElapsed,
      thresholdPct,
      projectedPctOverLast,
    },
  };
}

export function checkDailyAllowanceStatus(
  dailyAllowance: DailyAllowanceStatusInput,
): FinanceNotification | null {
  const sendHour = dailyAllowance.sendHour ?? DEFAULT_DAILY_ALLOWANCE_HOUR;
  if (dailyAllowance.currentHour < sendHour) {
    return null;
  }

  const body =
    dailyAllowance.remainingToday > 0n
      ? `امروز می‌تونی ${formatToman(dailyAllowance.remainingToday)} خرج کنی.`
      : "سهم امروز تموم شده.";

  return {
    ruleKey: "DAILY_ALLOWANCE",
    title: "سهم امروز",
    body,
    href: "/home",
    dedupeKey: dailyAllowance.dateKey,
    explanation: `این عدد همان سهم امروز در خانه است: باقی‌مانده قابل‌خرج این دوره تقسیم بر روزهای مانده، منهای خرج امروز.`,
    payload: {
      dateKey: dailyAllowance.dateKey,
      sendHour,
    },
  };
}

export function crossedGoalMilestone(currentAmount: bigint, targetAmount: bigint): GoalMilestone | null {
  const pct = integerPercent(currentAmount, targetAmount);
  return highestAtLeast(pct, GOAL_MILESTONES);
}

export function checkGoalMilestone(goal: GoalMilestoneInput): FinanceNotification | null {
  const milestone = crossedGoalMilestone(goal.currentAmount, goal.targetAmount);
  if (milestone == null) {
    return null;
  }

  return {
    ruleKey: "GOAL_MILESTONE",
    title: "هدف",
    body: `به ${toPersianDigits(milestone)}٪ هدف «${goal.name}» رسیدی! 🎉`,
    href: `/goals#goal-${goal.id}`,
    dedupeKey: `${goal.id}:${milestone}`,
    explanation: `موجودی هدف ${formatToman(goal.currentAmount)} از ${formatToman(goal.targetAmount)} است. این یادآوری برای مرحله ${toPersianDigits(milestone)}٪ است و تکرار نمی‌شود.`,
    payload: {
      goalId: goal.id,
      name: goal.name,
      milestone,
    },
  };
}

export type NotificationEvaluationInput = {
  enabledKeys: ReadonlySet<string>;
  noTransaction: NoTransactionTodayInput;
  budgets: BudgetThresholdInput[];
  recurring: RecurringExpenseInput[];
  weeklyStats: SpendingPaceInput;
  dailyAllowance: DailyAllowanceStatusInput;
  goals: GoalMilestoneInput[];
};

export function collectNotifications(input: NotificationEvaluationInput): FinanceNotification[] {
  const notifications: FinanceNotification[] = [];
  const enabled = input.enabledKeys;

  if (enabled.has("NO_TRANSACTION_TODAY")) {
    const item = checkNoTransactionToday(input.noTransaction);
    if (item) notifications.push(item);
  }

  if (enabled.has("BUDGET_THRESHOLD")) {
    for (const budget of input.budgets) {
      const item = checkBudgetThreshold(budget);
      if (item) notifications.push(item);
    }
  }

  if (enabled.has("UPCOMING_RECURRING")) {
    for (const recurring of input.recurring) {
      const item = checkUpcomingRecurringExpense(recurring);
      if (item) notifications.push(item);
    }
  }

  if (enabled.has("SPENDING_PACE_ANOMALY")) {
    const item = checkSpendingPaceAnomaly(input.weeklyStats);
    if (item) notifications.push(item);
  }

  if (enabled.has("DAILY_ALLOWANCE")) {
    const item = checkDailyAllowanceStatus(input.dailyAllowance);
    if (item) notifications.push(item);
  }

  if (enabled.has("GOAL_MILESTONE")) {
    for (const goal of input.goals) {
      const item = checkGoalMilestone(goal);
      if (item) notifications.push(item);
    }
  }

  return notifications;
}
