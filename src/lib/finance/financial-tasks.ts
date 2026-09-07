import type { FinancialTaskSource, FinancialTaskType, TransactionType } from "@prisma/client";
import { jalaliFromInstant, jalaliToEpochDay, type JalaliDate } from "@/lib/dates/tehran";
import { calculateBudgetUsage } from "@/lib/finance/budget-usage";
import { RECURRING_REMINDER_DAYS } from "@/lib/finance/notificationRules";

export type GeneratedTaskCandidate = {
  title: string;
  type: FinancialTaskType;
  dueDate: JalaliDate;
  sourceType: FinancialTaskSource;
  sourceId: string;
};

export type RecurringTaskInput = {
  id: string;
  name: string;
  type: TransactionType;
  nextRunAt: Date;
  isActive: boolean;
};

export type BudgetTaskInput = {
  id: string;
  name: string;
  spent: bigint;
  limit: bigint;
};

export function proposeGeneratedTasks(input: {
  today: JalaliDate;
  recurring: RecurringTaskInput[];
  budgets: BudgetTaskInput[];
}): GeneratedTaskCandidate[] {
  const tasks: GeneratedTaskCandidate[] = [];

  for (const item of input.recurring) {
    if (!item.isActive || item.type !== "EXPENSE") {
      continue;
    }

    const next = jalaliFromInstant(item.nextRunAt);
    const daysUntil = jalaliToEpochDay(next) - jalaliToEpochDay(input.today);

    if (daysUntil <= 0) {
      tasks.push({
        title: `پرداخت «${item.name}»`,
        type: "BILL_DUE",
        dueDate: next,
        sourceType: "RECURRING_TRANSACTION",
        sourceId: item.id,
      });
      continue;
    }

    if ((RECURRING_REMINDER_DAYS as readonly number[]).includes(daysUntil)) {
      const when = daysUntil === 1 ? "فردا" : "۳ روز دیگر";
      tasks.push({
        title: `${item.name} ${when} سررسیده`,
        type: "RECURRING_REMINDER",
        dueDate: input.today,
        sourceType: "RECURRING_TRANSACTION",
        sourceId: item.id,
      });
    }
  }

  for (const budget of input.budgets) {
    const usage = calculateBudgetUsage(budget.spent, budget.limit);
    if (usage.status === "healthy") {
      continue;
    }

    tasks.push({
      title:
        usage.status === "over"
          ? `بودجه «${budget.name}» از سقف رد شد`
          : `نگاهی به بودجه «${budget.name}»`,
      type: "BUDGET_CHECK",
      dueDate: input.today,
      sourceType: "BUDGET",
      sourceId: budget.id,
    });
  }

  return tasks;
}
