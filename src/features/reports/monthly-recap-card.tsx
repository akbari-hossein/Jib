import { formatToman, toPersianDigits } from "@/lib/currency/format";
import type { MonthlyRecapDto, RecapFieldId, RecapSelection } from "@/lib/finance/monthly-recap-data";
import { periodChangeCopy } from "@/lib/labels";
import { APP_NAME } from "@/lib/config/app";
import { cn } from "@/lib/utils";

const PALETTE = {
  bg: "#F5F2EA",
  fg: "#1C2430",
  muted: "rgba(28, 36, 48, 0.5)",
  faint: "rgba(28, 36, 48, 0.28)",
  line: "rgba(28, 36, 48, 0.1)",
  income: "#2F6F5E",
  expense: "#9A5648",
  savings: "#5A4E86",
} as const;

function hasField(selection: RecapSelection, id: RecapFieldId) {
  return selection.fields.includes(id);
}

function percentText(value: number, suffix?: string) {
  const body = `${toPersianDigits(value)}٪`;
  return suffix ? `${body} ${suffix}` : body;
}

function amountOrPercent(input: {
  exact: boolean;
  amount: bigint;
  percent: number | null;
  percentSuffix: string;
}): string | null {
  if (input.exact) {
    return formatToman(input.amount);
  }
  if (input.percent == null) {
    return null;
  }
  return percentText(input.percent, input.percentSuffix);
}

function heroFor(
  recap: MonthlyRecapDto,
  selection: RecapSelection,
): { id: RecapFieldId; value: string; label: string } | null {
  if (hasField(selection, "savingsRate") && recap.savingsRate != null) {
    return { id: "savingsRate", value: percentText(recap.savingsRate), label: "نرخ پس‌انداز" };
  }
  if (hasField(selection, "vsPreviousMonth") && recap.expenseChange.pct != null) {
    const direction =
      recap.expenseChange.direction === "down"
        ? "کمتر از ماه قبل"
        : recap.expenseChange.direction === "up"
          ? "بیشتر از ماه قبل"
          : "مثل ماه قبل";
    return { id: "vsPreviousMonth", value: percentText(recap.expenseChange.pct), label: direction };
  }
  if (hasField(selection, "daysLogged") && recap.daysLogged != null) {
    return { id: "daysLogged", value: toPersianDigits(recap.daysLogged), label: "روز ثبت" };
  }
  if (hasField(selection, "saved")) {
    const saved = BigInt(recap.saved);
    const value = amountOrPercent({
      exact: selection.exactAmounts,
      amount: saved < 0n ? -saved : saved,
      percent: recap.savingsRate,
      percentSuffix: "از درآمد",
    });
    if (value) {
      return {
        id: "saved",
        value,
        label: saved >= 0n ? "پس‌انداز" : "خرج بیشتر از درآمد",
      };
    }
  }
  return null;
}

type RecapRow = { id: RecapFieldId; label: string; value: string; tone?: "income" | "expense" | "savings" };

function rowsFor(recap: MonthlyRecapDto, selection: RecapSelection, heroId: RecapFieldId | null): RecapRow[] {
  const rows: RecapRow[] = [];
  const income = BigInt(recap.income);
  const expenses = BigInt(recap.expenses);
  const saved = BigInt(recap.saved);

  if (hasField(selection, "income") && selection.exactAmounts) {
    rows.push({ id: "income", label: "درآمد", value: formatToman(income), tone: "income" });
  }

  if (hasField(selection, "expenses")) {
    const value = amountOrPercent({
      exact: selection.exactAmounts,
      amount: expenses,
      percent: recap.expenseShareOfIncome,
      percentSuffix: "از درآمد",
    });
    if (value) {
      rows.push({ id: "expenses", label: "هزینه", value, tone: "expense" });
    }
  }

  if (hasField(selection, "saved") && heroId !== "saved") {
    const value = amountOrPercent({
      exact: selection.exactAmounts,
      amount: saved < 0n ? -saved : saved,
      percent: recap.savingsRate,
      percentSuffix: "از درآمد",
    });
    if (value) {
      rows.push({
        id: "saved",
        label: saved >= 0n ? "پس‌انداز" : "خرج بیشتر از درآمد",
        value,
        tone: "savings",
      });
    }
  }

  if (hasField(selection, "savingsRate") && recap.savingsRate != null && heroId !== "savingsRate") {
    rows.push({
      id: "savingsRate",
      label: "نرخ پس‌انداز",
      value: percentText(recap.savingsRate),
      tone: "savings",
    });
  }

  if (hasField(selection, "topCategory") && recap.topCategory) {
    const amount = BigInt(recap.topCategory.amount);
    const value = selection.exactAmounts
      ? formatToman(amount)
      : percentText(recap.topCategory.pct, "از هزینه");
    rows.push({
      id: "topCategory",
      label: recap.topCategory.name,
      value,
      tone: "expense",
    });
  }

  if (hasField(selection, "vsPreviousMonth") && heroId !== "vsPreviousMonth") {
    const copy = periodChangeCopy(recap.expenseChange, "month");
    if (copy) {
      rows.push({ id: "vsPreviousMonth", label: "نسبت به ماه قبل", value: copy });
    }
  }

  if (hasField(selection, "goalProgress") && recap.goal) {
    const contributed = BigInt(recap.goal.contributed);
    let value: string | null = null;
    if (recap.goal.pct != null) {
      value = percentText(recap.goal.pct);
    } else {
      value = amountOrPercent({
        exact: selection.exactAmounts,
        amount: contributed,
        percent: income > 0n ? Number((contributed * 100n) / income) : null,
        percentSuffix: "از درآمد",
      });
    }
    if (value) {
      rows.push({ id: "goalProgress", label: `هدف ${recap.goal.name}`, value, tone: "savings" });
    }
  }

  if (hasField(selection, "daysLogged") && recap.daysLogged != null && heroId !== "daysLogged") {
    rows.push({
      id: "daysLogged",
      label: "ثبت در ماه",
      value: `${toPersianDigits(recap.daysLogged)} روز`,
    });
  }

  if (hasField(selection, "budgetsUnder") && recap.budgetsUnder) {
    const { under, total } = recap.budgetsUnder;
    const value =
      under === total
        ? `${toPersianDigits(under)} بودجه زیر سقف`
        : `${toPersianDigits(under)} از ${toPersianDigits(total)} بودجه زیر سقف`;
    rows.push({ id: "budgetsUnder", label: "بودجه", value });
  }

  return rows;
}

function toneColor(tone: RecapRow["tone"]) {
  if (tone === "income") return PALETTE.income;
  if (tone === "expense") return PALETTE.expense;
  if (tone === "savings") return PALETTE.savings;
  return PALETTE.fg;
}

export function MonthlyRecapCard({
  recap,
  selection,
  variant,
  className,
}: {
  recap: MonthlyRecapDto;
  selection: RecapSelection;
  variant: "story" | "square";
  className?: string;
}) {
  const hero = heroFor(recap, selection);
  const rows = rowsFor(recap, selection, hero?.id ?? null);
  const story = variant === "story";

  return (
    <div
      dir="rtl"
      className={cn("flex h-full w-full flex-col font-sans", className)}
      style={{
        background: PALETTE.bg,
        color: PALETTE.fg,
        padding: story ? "11% 12%" : "9% 10%",
      }}
    >
      <header className="flex items-start justify-between gap-4">
        <p className="text-[0.7rem] font-medium" style={{ color: PALETTE.faint }}>
          {APP_NAME}
        </p>
        <p className="text-[0.7rem]" style={{ color: PALETTE.faint }}>
          خلاصه ماه
        </p>
      </header>

      <p
        className={cn("mt-6 font-semibold tracking-tight", story ? "text-[1.65rem]" : "text-[1.35rem]")}
        style={{ lineHeight: 1.25 }}
      >
        {recap.monthLabel}
      </p>

      {hero ? (
        <div className={cn("flex flex-col", story ? "mt-10" : "mt-6")}>
          <p
            className={cn(
              "numeric-display font-semibold tracking-tight",
              story ? "text-[3.4rem] leading-none" : "text-[2.6rem] leading-none",
            )}
            style={{ color: PALETTE.savings }}
          >
            {hero.value}
          </p>
          <p className="mt-3 text-[0.8rem]" style={{ color: PALETTE.muted }}>
            {hero.label}
          </p>
        </div>
      ) : null}

      <div
        className="mt-auto flex flex-col"
        style={{ gap: story ? "1.15rem" : "0.7rem", paddingTop: story ? "2.4rem" : "1.4rem" }}
      >
        {rows.map((row, index) => (
          <div key={row.id}>
            {index > 0 ? (
              <div
                className={story ? "mb-3" : "mb-2"}
                style={{ height: 1, width: "100%", background: PALETTE.line }}
              />
            ) : null}
            <div className="flex items-baseline justify-between gap-4">
              <p className="min-w-0 truncate text-[0.78rem]" style={{ color: PALETTE.muted }}>
                {row.id === "topCategory" ? `بزرگ‌ترین دسته · ${row.label}` : row.label}
              </p>
              <p
                className="numeric-display shrink-0 text-[0.9rem] font-semibold tracking-tight"
                style={{ color: toneColor(row.tone) }}
              >
                {row.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-8">
        <p className="text-[0.68rem]" style={{ color: PALETTE.faint }}>
          {APP_NAME}
        </p>
      </footer>
    </div>
  );
}
