import { calculateMonthlyChange, type MonthlyChange } from "@/lib/finance/monthly-change";
import { calculateSavingsRate } from "@/lib/finance/savings-rate";

export type CategorySpend = {
  categoryId: string | null;
  name: string;
  icon: string;
  amount: bigint;
};

export type RankedCategory = CategorySpend & {
  pct: number;
};

export type PeriodReview = {
  income: bigint;
  expenses: bigint;
  net: bigint;
  extraSavings: bigint;
  savingsRate: number | null;
  expenseChange: MonthlyChange;
  categories: RankedCategory[];
  topCategory: RankedCategory | null;
  lowestCategory: RankedCategory | null;
};

export function rankCategorySpend(
  categories: CategorySpend[],
  total: bigint,
): RankedCategory[] {
  return [...categories]
    .filter((category) => category.amount > 0n)
    .sort((left, right) => {
      if (left.amount === right.amount) {
        return left.name.localeCompare(right.name, "fa");
      }
      return left.amount > right.amount ? -1 : 1;
    })
    .map((category) => ({
      ...category,
      pct: total <= 0n ? 0 : Number((category.amount * 100n) / total),
    }));
}

export function assemblePeriodReview(input: {
  income: bigint;
  expenses: bigint;
  previousExpenses: bigint;
  categories: CategorySpend[];
  extraSavings?: bigint;
}): PeriodReview {
  const extraSavings = input.extraSavings ?? 0n;
  const net = input.income - input.expenses + extraSavings;
  const categories = rankCategorySpend(input.categories, input.expenses);
  return {
    income: input.income,
    expenses: input.expenses,
    net,
    extraSavings,
    savingsRate: calculateSavingsRate(input.income, input.expenses, extraSavings),
    expenseChange: calculateMonthlyChange(input.expenses, input.previousExpenses),
    categories,
    topCategory: categories[0] ?? null,
    lowestCategory: categories.length > 1 ? categories[categories.length - 1]! : null,
  };
}
