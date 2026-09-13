import { describe, expect, it } from "vitest";
import {
  aggregateMonthlyFlows,
  getCategoryBreakdown,
  getMonthComparisonData,
  getMonthlyTrendData,
  getSavingsRateSeries,
  listChartMonthWindow,
  serializeReportCharts,
} from "@/lib/finance/report-charts";

const window1404Farvardin = listChartMonthWindow({ year: 1404, month: 1 });

describe("listChartMonthWindow", () => {
  it("returns six Jalali months ending at the current month", () => {
    expect(window1404Farvardin).toEqual([
      { year: 1403, month: 8 },
      { year: 1403, month: 9 },
      { year: 1403, month: 10 },
      { year: 1403, month: 11 },
      { year: 1403, month: 12 },
      { year: 1404, month: 1 },
    ]);
  });
});

describe("aggregateMonthlyFlows", () => {
  it("fills empty months and keeps income and expenses separate", () => {
    const flows = aggregateMonthlyFlows(window1404Farvardin, [
      { type: "INCOME", amount: 30_000_000n, year: 1404, month: 1 },
      { type: "EXPENSE", amount: 8_000_000n, year: 1404, month: 1 },
      { type: "EXPENSE", amount: 4_000_000n, year: 1404, month: 1 },
      { type: "EXPENSE", amount: 10_000_000n, year: 1403, month: 12 },
      { type: "INCOME", amount: 1_000_000n, year: 1402, month: 12 },
    ]);

    expect(flows).toHaveLength(6);
    expect(flows[4]).toMatchObject({ year: 1403, month: 12, income: 0n, expenses: 10_000_000n });
    expect(flows[5]).toMatchObject({ year: 1404, month: 1, income: 30_000_000n, expenses: 12_000_000n });
    expect(flows[0]?.income).toBe(0n);
  });
});

describe("getMonthlyTrendData", () => {
  it("labels Jalali months and explains an expense drop", () => {
    const trend = getMonthlyTrendData([
      { year: 1403, month: 8, income: 20_000_000n, expenses: 10_000_000n },
      { year: 1403, month: 9, income: 20_000_000n, expenses: 9_000_000n },
      { year: 1403, month: 10, income: 20_000_000n, expenses: 9_000_000n },
      { year: 1403, month: 11, income: 20_000_000n, expenses: 8_000_000n },
      { year: 1403, month: 12, income: 20_000_000n, expenses: 8_000_000n },
      { year: 1404, month: 1, income: 20_000_000n, expenses: 8_000_000n },
    ]);

    expect(trend.points[0]?.monthLabel).toBe("آبان");
    expect(trend.points[5]?.monthLabel).toBe("فروردین");
    expect(trend.summary).toBe("خرج فروردین نسبت به آبان ۲۰٪ کمتر شده.");
  });

  it("falls back to the six-month net when the first month has no expenses", () => {
    const trend = getMonthlyTrendData([
      { year: 1403, month: 8, income: 0n, expenses: 0n },
      { year: 1403, month: 9, income: 10_000_000n, expenses: 4_000_000n },
      { year: 1403, month: 10, income: 0n, expenses: 0n },
      { year: 1403, month: 11, income: 0n, expenses: 0n },
      { year: 1403, month: 12, income: 0n, expenses: 0n },
      { year: 1404, month: 1, income: 10_000_000n, expenses: 3_000_000n },
    ]);

    expect(trend.summary).toBe("در این شش ماه درآمدت از خرجت بیشتر بوده.");
  });
});

describe("getCategoryBreakdown", () => {
  it("sorts by amount and explains the largest share", () => {
    const breakdown = getCategoryBreakdown(
      [
        { categoryId: "food", name: "غذا", icon: "utensils", amount: 6_000_000n },
        { categoryId: "rent", name: "اجاره", icon: "home", amount: 12_000_000n },
        { categoryId: "fun", name: "سرگرمی", icon: "sparkles", amount: 2_000_000n },
      ],
      20_000_000n,
    );

    expect(breakdown.items.map((item) => item.name)).toEqual(["اجاره", "غذا", "سرگرمی"]);
    expect(breakdown.summary).toBe("بیشترین خرج این ماه در دستهٔ اجاره بوده — ۶۰٪ از کل.");
  });

  it("folds the tail into سایر after eight bars", () => {
    const categories = Array.from({ length: 10 }, (_, index) => ({
      categoryId: `c${index}`,
      name: `دسته ${index + 1}`,
      icon: "repeat",
      amount: BigInt(10 - index) * 1_000_000n,
    }));
    const total = categories.reduce((sum, item) => sum + item.amount, 0n);
    const breakdown = getCategoryBreakdown(categories, total);

    expect(breakdown.items).toHaveLength(8);
    expect(breakdown.items[7]?.name).toBe("سایر");
    expect(breakdown.items[7]?.amount).toBe(6_000_000n);
  });
});

describe("getMonthComparisonData", () => {
  it("builds two bars and a complete comparison sentence", () => {
    const comparison = getMonthComparisonData({
      previous: { year: 1403, month: 12, income: 20_000_000n, expenses: 10_000_000n },
      current: { year: 1404, month: 1, income: 20_000_000n, expenses: 9_200_000n },
    });

    expect(comparison.bars.map((bar) => bar.monthLabel)).toEqual(["اسفند", "فروردین"]);
    expect(comparison.summary).toBe("خرجت نسبت به ماه قبل ۸٪ کمتر شده.");
  });

  it("explains a first month with no previous spend", () => {
    const comparison = getMonthComparisonData({
      previous: { year: 1403, month: 12, income: 0n, expenses: 0n },
      current: { year: 1404, month: 1, income: 0n, expenses: 4_000_000n },
    });

    expect(comparison.summary).toBe("ماه اولته؛ هنوز ماه قبلی برای مقایسه نیست.");
  });
});

describe("getSavingsRateSeries", () => {
  it("uses integer rates and explains the point change", () => {
    const series = getSavingsRateSeries([
      { year: 1403, month: 8, income: 10_000_000n, expenses: 8_000_000n },
      { year: 1403, month: 9, income: 10_000_000n, expenses: 7_000_000n },
      { year: 1403, month: 10, income: 0n, expenses: 1_000_000n },
      { year: 1403, month: 11, income: 10_000_000n, expenses: 6_000_000n },
      { year: 1403, month: 12, income: 10_000_000n, expenses: 6_000_000n },
      { year: 1404, month: 1, income: 10_000_000n, expenses: 5_000_000n },
    ]);

    expect(series.points[2]?.rate).toBeNull();
    expect(series.points[5]?.rate).toBe(50);
    expect(series.summary).toBe("نرخ پس‌انداز این ماه ۵۰٪ است — ۱۰ واحد بیشتر از ماه قبل.");
  });

  it("does not treat an older month as this month when current income is missing", () => {
    const series = getSavingsRateSeries([
      { year: 1403, month: 8, income: 10_000_000n, expenses: 5_000_000n },
      { year: 1403, month: 9, income: 10_000_000n, expenses: 5_000_000n },
      { year: 1403, month: 10, income: 10_000_000n, expenses: 5_000_000n },
      { year: 1403, month: 11, income: 10_000_000n, expenses: 5_000_000n },
      { year: 1403, month: 12, income: 10_000_000n, expenses: 5_000_000n },
      { year: 1404, month: 1, income: 0n, expenses: 2_000_000n },
    ]);

    expect(series.summary).toBe("برای نرخ پس‌انداز این ماه، درآمد را ثبت کن.");
  });
});

describe("serializeReportCharts", () => {
  it("hides charts that do not yet answer a question", () => {
    const flows = aggregateMonthlyFlows(window1404Farvardin, [
      { type: "EXPENSE", amount: 2_000_000n, year: 1404, month: 1 },
    ]);
    const dto = serializeReportCharts({
      trend: getMonthlyTrendData(flows),
      categories: getCategoryBreakdown(
        [{ categoryId: "food", name: "غذا", icon: "utensils", amount: 2_000_000n }],
        2_000_000n,
      ),
      comparison: getMonthComparisonData({
        previous: flows[4]!,
        current: flows[5]!,
      }),
      savingsRate: getSavingsRateSeries(flows),
    });

    expect(dto.trend).toBeNull();
    expect(dto.savingsRate).toBeNull();
    expect(dto.categories?.items[0]?.amount).toBe(2_000_000);
    expect(dto.comparison?.bars[1]?.isCurrent).toBe(true);
  });
});
