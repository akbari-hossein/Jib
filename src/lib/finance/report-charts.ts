import { toPersianDigits } from "@/lib/currency/format";
import { addJalaliMonths } from "@/lib/dates/tehran";
import { calculateMonthlyChange } from "@/lib/finance/monthly-change";
import { rankCategorySpend, type CategorySpend, type RankedCategory } from "@/lib/finance/reports";
import { calculateSavingsRate } from "@/lib/finance/savings-rate";
import { JALALI_MONTHS } from "@/lib/labels";

export const REPORT_TREND_MONTHS = 6;
export const REPORT_CATEGORY_BAR_LIMIT = 8;

export type ChartMonthKey = {
  year: number;
  month: number;
};

export type ChartTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: bigint;
  year: number;
  month: number;
};

export type MonthlyFlow = ChartMonthKey & {
  income: bigint;
  expenses: bigint;
};

export type MonthlyTrendPoint = MonthlyFlow & {
  monthLabel: string;
};

export type CategoryBreakdownItem = RankedCategory;

export type MonthComparisonBar = {
  year: number;
  month: number;
  monthLabel: string;
  amount: bigint;
  isCurrent: boolean;
};

export type SavingsRatePoint = {
  year: number;
  month: number;
  monthLabel: string;
  rate: number | null;
};

export type MonthlyTrendChartData = {
  points: MonthlyTrendPoint[];
  summary: string;
};

export type CategoryBreakdownData = {
  items: CategoryBreakdownItem[];
  summary: string;
};

export type MonthComparisonData = {
  bars: MonthComparisonBar[];
  summary: string;
};

export type SavingsRateSeriesData = {
  points: SavingsRatePoint[];
  summary: string;
};

export type ReportChartsDto = {
  trend: {
    summary: string;
    points: Array<{ monthLabel: string; income: number; expenses: number }>;
  } | null;
  categories: {
    summary: string;
    items: Array<{ name: string; amount: number; pct: number }>;
  } | null;
  comparison: {
    summary: string;
    bars: Array<{ label: string; amount: number; isCurrent: boolean }>;
  } | null;
  savingsRate: {
    summary: string;
    points: Array<{ monthLabel: string; rate: number | null }>;
  } | null;
};

export function chartMonthLabel(month: number): string {
  return JALALI_MONTHS[month - 1] ?? "";
}

export function listChartMonthWindow(
  end: ChartMonthKey,
  count = REPORT_TREND_MONTHS,
): ChartMonthKey[] {
  const start = addJalaliMonths({ year: end.year, month: end.month, day: 1 }, -(count - 1));
  return Array.from({ length: count }, (_, index) => {
    const date = addJalaliMonths(start, index);
    return { year: date.year, month: date.month };
  });
}

export function aggregateMonthlyFlows(
  months: ChartMonthKey[],
  transactions: ChartTransaction[],
): MonthlyFlow[] {
  const totals = new Map<string, MonthlyFlow>(
    months.map((month) => [
      monthKey(month),
      { year: month.year, month: month.month, income: 0n, expenses: 0n },
    ]),
  );

  for (const transaction of transactions) {
    const bucket = totals.get(monthKey(transaction));
    if (!bucket) {
      continue;
    }
    if (transaction.type === "INCOME") {
      bucket.income += transaction.amount;
    } else {
      bucket.expenses += transaction.amount;
    }
  }

  return months.map((month) => totals.get(monthKey(month))!);
}

export function getMonthlyTrendData(flows: MonthlyFlow[]): MonthlyTrendChartData {
  const points = flows.map(toTrendPoint);
  return {
    points,
    summary: monthlyTrendCopy(points),
  };
}

export function getCategoryBreakdown(
  categories: CategorySpend[],
  total: bigint,
): CategoryBreakdownData {
  const ranked = rankCategorySpend(categories, total);
  const items = collapseCategoryTail(ranked, total);
  return {
    items,
    summary: categoryBreakdownCopy(items),
  };
}

export function getMonthComparisonData(input: {
  current: MonthlyFlow;
  previous: MonthlyFlow;
}): MonthComparisonData {
  const bars: MonthComparisonBar[] = [
    {
      year: input.previous.year,
      month: input.previous.month,
      monthLabel: chartMonthLabel(input.previous.month),
      amount: input.previous.expenses,
      isCurrent: false,
    },
    {
      year: input.current.year,
      month: input.current.month,
      monthLabel: chartMonthLabel(input.current.month),
      amount: input.current.expenses,
      isCurrent: true,
    },
  ];

  return {
    bars,
    summary: monthComparisonCopy(input.current.expenses, input.previous.expenses),
  };
}

export function getSavingsRateSeries(flows: MonthlyFlow[]): SavingsRateSeriesData {
  const points = flows.map((flow) => ({
    year: flow.year,
    month: flow.month,
    monthLabel: chartMonthLabel(flow.month),
    rate: calculateSavingsRate(flow.income, flow.expenses),
  }));

  return {
    points,
    summary: savingsRateSeriesCopy(points),
  };
}

export function serializeReportCharts(input: {
  trend: MonthlyTrendChartData;
  categories: CategoryBreakdownData;
  comparison: MonthComparisonData;
  savingsRate: SavingsRateSeriesData;
}): ReportChartsDto {
  const trendActive = input.trend.points.filter(hasFlow).length;
  const definedRates = input.savingsRate.points.filter((point) => point.rate != null).length;
  const comparisonTotal = input.comparison.bars.reduce((sum, bar) => sum + bar.amount, 0n);

  return {
    trend:
      trendActive >= 2
        ? {
            summary: input.trend.summary,
            points: input.trend.points.map((point) => ({
              monthLabel: point.monthLabel,
              income: toChartNumber(point.income),
              expenses: toChartNumber(point.expenses),
            })),
          }
        : null,
    categories:
      input.categories.items.length > 0
        ? {
            summary: input.categories.summary,
            items: input.categories.items.map((item) => ({
              name: item.name,
              amount: toChartNumber(item.amount),
              pct: item.pct,
            })),
          }
        : null,
    comparison:
      comparisonTotal > 0n
        ? {
            summary: input.comparison.summary,
            bars: input.comparison.bars.map((bar) => ({
              label: bar.monthLabel,
              amount: toChartNumber(bar.amount),
              isCurrent: bar.isCurrent,
            })),
          }
        : null,
    savingsRate:
      definedRates >= 2
        ? {
            summary: input.savingsRate.summary,
            points: input.savingsRate.points.map((point) => ({
              monthLabel: point.monthLabel,
              rate: point.rate,
            })),
          }
        : null,
  };
}

function monthKey(month: ChartMonthKey): string {
  return `${month.year}-${month.month}`;
}

function toTrendPoint(flow: MonthlyFlow): MonthlyTrendPoint {
  return {
    ...flow,
    monthLabel: chartMonthLabel(flow.month),
  };
}

function hasFlow(flow: Pick<MonthlyFlow, "income" | "expenses">): boolean {
  return flow.income > 0n || flow.expenses > 0n;
}

function toChartNumber(amount: bigint): number {
  return Number(amount);
}

function collapseCategoryTail(items: RankedCategory[], total: bigint): RankedCategory[] {
  if (items.length <= REPORT_CATEGORY_BAR_LIMIT) {
    return items;
  }

  const head = items.slice(0, REPORT_CATEGORY_BAR_LIMIT - 1);
  const tailAmount = items
    .slice(REPORT_CATEGORY_BAR_LIMIT - 1)
    .reduce((sum, item) => sum + item.amount, 0n);

  return [
    ...head,
    {
      categoryId: "other",
      name: "سایر",
      icon: "repeat",
      amount: tailAmount,
      pct: total <= 0n ? 0 : Number((tailAmount * 100n) / total),
    },
  ];
}

function monthlyTrendCopy(points: MonthlyTrendPoint[]): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return "هنوز ماه‌های کافی برای دیدن روند نیست.";
  }

  const active = points.filter(hasFlow);
  if (active.length < 2) {
    return "هنوز ماه‌های کافی برای دیدن روند نیست.";
  }

  const change = calculateMonthlyChange(last.expenses, first.expenses);
  if (change.direction === "down" && change.pct != null) {
    return `خرج ${last.monthLabel} نسبت به ${first.monthLabel} ${toPersianDigits(change.pct)}٪ کمتر شده.`;
  }
  if (change.direction === "up" && change.pct != null) {
    return `خرج ${last.monthLabel} نسبت به ${first.monthLabel} ${toPersianDigits(change.pct)}٪ بیشتر شده.`;
  }
  if (change.direction === "flat") {
    return `خرج ${last.monthLabel} مثل ${first.monthLabel} است.`;
  }

  const totalIncome = points.reduce((sum, point) => sum + point.income, 0n);
  const totalExpenses = points.reduce((sum, point) => sum + point.expenses, 0n);
  if (totalIncome > totalExpenses) {
    return "در این شش ماه درآمدت از خرجت بیشتر بوده.";
  }
  if (totalExpenses > totalIncome) {
    return "در این شش ماه بیشتر از درآمدت خرج کردی.";
  }
  return "در این شش ماه درآمد و خرجت برابر بوده.";
}

function categoryBreakdownCopy(items: CategoryBreakdownItem[]): string {
  const top = items[0];
  if (!top) {
    return "";
  }
  if (items.length === 1) {
    return `همهٔ خرج این ماه در دستهٔ ${top.name} بوده.`;
  }
  return `بیشترین خرج این ماه در دستهٔ ${top.name} بوده — ${toPersianDigits(top.pct)}٪ از کل.`;
}

function monthComparisonCopy(current: bigint, previous: bigint): string {
  const change = calculateMonthlyChange(current, previous);
  if (change.direction === "new") {
    return "ماه اولته؛ هنوز ماه قبلی برای مقایسه نیست.";
  }
  if (change.direction === "flat") {
    return "خرج این ماه مثل ماه قبل است.";
  }
  if (change.pct == null) {
    return "";
  }
  if (change.direction === "down") {
    return `خرجت نسبت به ماه قبل ${toPersianDigits(change.pct)}٪ کمتر شده.`;
  }
  return `خرجت نسبت به ماه قبل ${toPersianDigits(change.pct)}٪ بیشتر شده.`;
}

function savingsRateSeriesCopy(points: SavingsRatePoint[]): string {
  const latest = points[points.length - 1];
  if (latest?.rate == null) {
    return "برای نرخ پس‌انداز این ماه، درآمد را ثبت کن.";
  }

  const previous = points[points.length - 2];
  if (previous?.rate == null) {
    return `نرخ پس‌انداز این ماه ${toPersianDigits(latest.rate)}٪ است.`;
  }

  const diff = latest.rate - previous.rate;
  if (diff > 0) {
    return `نرخ پس‌انداز این ماه ${toPersianDigits(latest.rate)}٪ است — ${toPersianDigits(diff)} واحد بیشتر از ماه قبل.`;
  }
  if (diff < 0) {
    return `نرخ پس‌انداز این ماه ${toPersianDigits(latest.rate)}٪ است — ${toPersianDigits(-diff)} واحد کمتر از ماه قبل.`;
  }
  return `نرخ پس‌انداز این ماه ${toPersianDigits(latest.rate)}٪ است؛ نسبت به ماه قبل تغییری نکرده.`;
}
