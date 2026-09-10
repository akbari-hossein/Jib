import {
  getIncomeCycle,
  gregorianUtcFromJalali,
  type JalaliDate,
} from "@/lib/dates/tehran";
import {
  calculateAvailableMoney,
  sumLiquidBalance,
  sumPlannedExpenses,
  sumReservedForGoals,
} from "@/lib/finance/available-money";
import { calculateDailyAllowance } from "@/lib/finance/daily-allowance";
import { calculateMonthlyChange } from "@/lib/finance/monthly-change";
import { calculateRequiredSavings } from "@/lib/finance/required-savings";
import type {
  AccountSnapshot,
  GoalSnapshot,
  PlannedExpenseSnapshot,
} from "@/lib/finance/types";

export function assembleDashboard(input: {
  accounts: AccountSnapshot[];
  goals: GoalSnapshot[];
  plannedExpenses: PlannedExpenseSnapshot[];
  spentToday: bigint;
  monthlySpent: bigint;
  previousMonthSpent: bigint;
  today: JalaliDate;
  incomeDayOfMonth: number | null;
  nextRecurringIncome?: JalaliDate | null;
  outstandingDebtsIOwe?: bigint;
}) {
  const cycle = getIncomeCycle(
    input.today,
    input.incomeDayOfMonth,
    input.nextRecurringIncome ?? null,
  );
  const liquidBalance = sumLiquidBalance(input.accounts);
  const reservedForGoals = sumReservedForGoals(input.goals);
  const todayUtc = gregorianUtcFromJalali(input.today);
  const nextIncomeUtc = gregorianUtcFromJalali(cycle.nextIncomeDate);
  const plannedExpenses = sumPlannedExpenses(
    input.plannedExpenses,
    todayUtc,
    nextIncomeUtc,
  );
  const requiredSavings = calculateRequiredSavings({
    goals: input.goals,
    today: todayUtc,
    remainingDays: cycle.remainingDays,
    daysInCycle: cycle.daysInCycle,
  });
  const outstandingDebtsIOwe = input.outstandingDebtsIOwe ?? 0n;
  const availableMoney = calculateAvailableMoney({
    liquidBalance,
    reservedForGoals,
    plannedExpenses,
    requiredSavings,
    outstandingDebtsIOwe,
  });
  const allowance = calculateDailyAllowance({
    availableMoney,
    spentToday: input.spentToday,
    remainingDays: cycle.remainingDays,
  });
  const monthlyChange = calculateMonthlyChange(
    input.monthlySpent,
    input.previousMonthSpent,
  );

  return {
    cycle,
    liquidBalance,
    reservedForGoals,
    plannedExpenses,
    requiredSavings,
    outstandingDebtsIOwe,
    availableMoney,
    allowance,
    monthlyChange,
  };
}
