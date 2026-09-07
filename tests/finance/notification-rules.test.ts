import { describe, expect, it } from "vitest";
import {
  checkBudgetThreshold,
  checkDailyAllowanceStatus,
  checkGoalMilestone,
  checkNoTransactionToday,
  checkSpendingPaceAnomaly,
  checkUpcomingRecurringExpense,
  collectNotifications,
  projectWeekSpend,
} from "@/lib/finance/notificationRules";

const today = { year: 1404, month: 6, day: 10 };

describe("checkNoTransactionToday", () => {
  const base = {
    hasLoggedToday: false,
    activeDaysInWindow: 6,
    currentHour: 21,
    dateKey: "1404-06-10",
  };

  it("nudges a daily logger after evening if today is empty", () => {
    const result = checkNoTransactionToday(base);
    expect(result?.ruleKey).toBe("NO_TRANSACTION_TODAY");
    expect(result?.body).toBe("امروز هنوز تراکنشی ثبت نکردی. یه نگاه سریع بنداز؟");
    expect(result?.href).toBe("/transactions");
    expect(result?.dedupeKey).toBe("1404-06-10");
  });

  it("stays quiet before the evening hour", () => {
    expect(checkNoTransactionToday({ ...base, currentHour: 19 })).toBeNull();
  });

  it("stays quiet if the user already logged today", () => {
    expect(checkNoTransactionToday({ ...base, hasLoggedToday: true })).toBeNull();
  });

  it("stays quiet if the user is not a near-daily logger", () => {
    expect(checkNoTransactionToday({ ...base, activeDaysInWindow: 3 })).toBeNull();
  });
});

describe("checkBudgetThreshold", () => {
  const food = {
    budgetId: "cat_food",
    name: "غذا",
    limit: 4_000_000n,
    period: "1404-06",
  };

  it("fires at 75% with non-judgmental copy of actual usage", () => {
    const result = checkBudgetThreshold({ ...food, spent: 3_400_000n });
    expect(result?.dedupeKey).toBe("cat_food:75:1404-06");
    expect(result?.body).toBe("۸۵٪ از بودجه‌ی «غذا» رو مصرف کردی.");
    expect(result?.href).toBe("/budgets#budget-cat_food");
    expect(result?.payload.threshold).toBe(75);
  });

  it("uses the 90% threshold when usage reaches it", () => {
    const result = checkBudgetThreshold({ ...food, spent: 3_600_000n });
    expect(result?.dedupeKey).toBe("cat_food:90:1404-06");
    expect(result?.payload.threshold).toBe(90);
  });

  it("uses the 100% threshold at or above the limit", () => {
    const result = checkBudgetThreshold({ ...food, spent: 4_100_000n });
    expect(result?.dedupeKey).toBe("cat_food:100:1404-06");
    expect(result?.payload.threshold).toBe(100);
    expect(result?.body).toContain("۱۰۲٪");
  });

  it("does not fire below 75%", () => {
    expect(checkBudgetThreshold({ ...food, spent: 2_800_000n })).toBeNull();
  });

  it("does not fire when the limit is zero", () => {
    expect(checkBudgetThreshold({ ...food, spent: 1n, limit: 0n })).toBeNull();
  });
});

describe("checkUpcomingRecurringExpense", () => {
  const bill = {
    id: "rec_power",
    name: "قبض برق",
    amount: 1_200_000n,
    type: "EXPENSE" as const,
    today,
  };

  it("fires 3 days before due", () => {
    const result = checkUpcomingRecurringExpense({
      ...bill,
      nextRunAt: { year: 1404, month: 6, day: 13 },
    });
    expect(result?.body).toBe("قبض برق ۳ روز دیگه سررسیده (۱٫۲ میلیون تومان).");
    expect(result?.dedupeKey).toBe("rec_power:3:1404-06-13");
    expect(result?.href).toBe("/recurring#recurring-rec_power");
  });

  it("fires 1 day before due", () => {
    const result = checkUpcomingRecurringExpense({
      ...bill,
      nextRunAt: { year: 1404, month: 6, day: 11 },
    });
    expect(result?.body).toContain("۱ روز دیگه");
    expect(result?.dedupeKey).toBe("rec_power:1:1404-06-11");
  });

  it("does not fire 2 days before, on the due day, or for income", () => {
    expect(
      checkUpcomingRecurringExpense({
        ...bill,
        nextRunAt: { year: 1404, month: 6, day: 12 },
      }),
    ).toBeNull();
    expect(
      checkUpcomingRecurringExpense({
        ...bill,
        nextRunAt: today,
      }),
    ).toBeNull();
    expect(
      checkUpcomingRecurringExpense({
        ...bill,
        type: "INCOME",
        nextRunAt: { year: 1404, month: 6, day: 13 },
      }),
    ).toBeNull();
  });
});

describe("checkSpendingPaceAnomaly", () => {
  it("projects linearly and fires when the week is on track to beat last week by more than 25%", () => {
    expect(projectWeekSpend(600_000n, 3)).toBe(1_400_000n);

    const result = checkSpendingPaceAnomaly({
      currentWeekSpendToDate: 600_000n,
      lastWeekTotal: 1_000_000n,
      daysElapsed: 3,
      weekKey: "1404-06-08",
    });
    expect(result?.ruleKey).toBe("SPENDING_PACE_ANOMALY");
    expect(result?.body).toBe("این هفته سریع‌تر از هفته‌ی قبل داری خرج می‌کنی.");
    expect(result?.dedupeKey).toBe("week:1404-06-08");
    expect(result?.href).toBe("/reports#week");
    expect(result?.explanation).toContain("× ۷ ÷ ۳");
    expect(result?.explanation).toContain("تا جمعه");
  });

  it("does not fire when the linear projection stays within the threshold", () => {
    expect(
      checkSpendingPaceAnomaly({
        currentWeekSpendToDate: 500_000n,
        lastWeekTotal: 1_000_000n,
        daysElapsed: 3,
        weekKey: "1404-06-08",
      }),
    ).toBeNull();
  });

  it("does not fire without a last-week baseline", () => {
    expect(
      checkSpendingPaceAnomaly({
        currentWeekSpendToDate: 800_000n,
        lastWeekTotal: 0n,
        daysElapsed: 2,
        weekKey: "1404-06-08",
      }),
    ).toBeNull();
  });
});

describe("checkDailyAllowanceStatus", () => {
  it("sends the daily share at or after the configured hour", () => {
    const result = checkDailyAllowanceStatus({
      remainingToday: 480_000n,
      currentHour: 9,
      sendHour: 9,
      dateKey: "1404-06-10",
    });
    expect(result?.body).toBe("امروز می‌تونی ۴۸۰٬۰۰۰ تومان خرج کنی.");
    expect(result?.href).toBe("/home");
    expect(result?.dedupeKey).toBe("1404-06-10");
  });

  it("waits until the configured hour", () => {
    expect(
      checkDailyAllowanceStatus({
        remainingToday: 480_000n,
        currentHour: 8,
        sendHour: 9,
        dateKey: "1404-06-10",
      }),
    ).toBeNull();
  });
});

describe("checkGoalMilestone", () => {
  const macbook = {
    id: "goal_mac",
    name: "مک‌بوک",
    targetAmount: 80_000_000n,
  };

  it("fires at 50%", () => {
    const result = checkGoalMilestone({ ...macbook, currentAmount: 40_000_000n });
    expect(result?.body).toBe("به ۵۰٪ هدف «مک‌بوک» رسیدی.");
    expect(result?.dedupeKey).toBe("goal_mac:50");
    expect(result?.href).toBe("/goals#goal-goal_mac");
  });

  it("uses the highest crossed milestone", () => {
    expect(checkGoalMilestone({ ...macbook, currentAmount: 20_000_000n })?.payload.milestone).toBe(25);
    expect(checkGoalMilestone({ ...macbook, currentAmount: 80_000_000n })?.payload.milestone).toBe(100);
  });

  it("does not fire below 25%", () => {
    expect(checkGoalMilestone({ ...macbook, currentAmount: 10_000_000n })).toBeNull();
  });
});

describe("collectNotifications", () => {
  it("only runs enabled rules", () => {
    const result = collectNotifications({
      enabledKeys: new Set(["GOAL_MILESTONE"]),
      noTransaction: {
        hasLoggedToday: false,
        activeDaysInWindow: 7,
        currentHour: 21,
        dateKey: "1404-06-10",
      },
      budgets: [],
      recurring: [],
      weeklyStats: {
        currentWeekSpendToDate: 0n,
        lastWeekTotal: 0n,
        daysElapsed: 1,
        weekKey: "1404-06-08",
      },
      dailyAllowance: {
        remainingToday: 1n,
        currentHour: 9,
        dateKey: "1404-06-10",
      },
      goals: [{ id: "g1", name: "سفر", currentAmount: 5_000_000n, targetAmount: 10_000_000n }],
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.ruleKey).toBe("GOAL_MILESTONE");
  });
});
