import { describe, expect, it } from "vitest";
import { addJalaliDays, gregorianUtcFromJalali } from "@/lib/dates/tehran";
import { proposeGeneratedTasks } from "@/lib/finance/financial-tasks";

const TODAY = { year: 1404, month: 6, day: 10 };

describe("proposeGeneratedTasks", () => {
  it("creates a bill task when a recurring expense is due today or overdue", () => {
    const yesterday = gregorianUtcFromJalali(addJalaliDays(TODAY, -1));
    const tasks = proposeGeneratedTasks({
      today: TODAY,
      recurring: [
        {
          id: "rent",
          name: "اجاره",
          type: "EXPENSE",
          nextRunAt: gregorianUtcFromJalali(TODAY),
          isActive: true,
        },
        {
          id: "overdue",
          name: "اینترنت",
          type: "EXPENSE",
          nextRunAt: yesterday,
          isActive: true,
        },
        {
          id: "salary",
          name: "حقوق",
          type: "INCOME",
          nextRunAt: gregorianUtcFromJalali(TODAY),
          isActive: true,
        },
      ],
      budgets: [],
    });

    expect(tasks).toEqual([
      {
        title: "پرداخت «اجاره»",
        type: "BILL_DUE",
        dueDate: TODAY,
        sourceType: "RECURRING_TRANSACTION",
        sourceId: "rent",
      },
      {
        title: "پرداخت «اینترنت»",
        type: "BILL_DUE",
        dueDate: addJalaliDays(TODAY, -1),
        sourceType: "RECURRING_TRANSACTION",
        sourceId: "overdue",
      },
    ]);
  });

  it("creates a reminder for recurring expenses 1 or 3 days away", () => {
    const tasks = proposeGeneratedTasks({
      today: TODAY,
      recurring: [
        {
          id: "water",
          name: "آب",
          type: "EXPENSE",
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 1)),
          isActive: true,
        },
        {
          id: "gas",
          name: "گاز",
          type: "EXPENSE",
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 3)),
          isActive: true,
        },
        {
          id: "later",
          name: "بیمه",
          type: "EXPENSE",
          nextRunAt: gregorianUtcFromJalali(addJalaliDays(TODAY, 5)),
          isActive: true,
        },
      ],
      budgets: [],
    });

    expect(tasks.map((task) => [task.sourceId, task.type, task.title, task.dueDate])).toEqual([
      ["water", "RECURRING_REMINDER", "آب فردا سررسیده", TODAY],
      ["gas", "RECURRING_REMINDER", "گاز ۳ روز دیگر سررسیده", TODAY],
    ]);
  });

  it("creates a budget check only when usage is near or over the limit", () => {
    const tasks = proposeGeneratedTasks({
      today: TODAY,
      recurring: [],
      budgets: [
        { id: "food", name: "غذا", spent: 8_000n, limit: 10_000n },
        { id: "transport", name: "حمل‌ونقل", spent: 12_000n, limit: 10_000n },
        { id: "fun", name: "تفریح", spent: 2_000n, limit: 10_000n },
      ],
    });

    expect(tasks).toEqual([
      {
        title: "بودجه «غذا» نزدیک سقفه",
        type: "BUDGET_CHECK",
        dueDate: TODAY,
        sourceType: "BUDGET",
        sourceId: "food",
      },
      {
        title: "بودجه «حمل‌ونقل» از سقف رد شد",
        type: "BUDGET_CHECK",
        dueDate: TODAY,
        sourceType: "BUDGET",
        sourceId: "transport",
      },
    ]);
  });
});
