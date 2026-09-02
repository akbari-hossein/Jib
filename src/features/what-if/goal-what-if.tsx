"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { FormulaRow, WhyThisNumber } from "@/components/finance/why-this-number";
import { CURRENCY_LABEL } from "@/lib/config/app";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { applyTomanInputChange, formatTomanInput } from "@/lib/currency/input";
import {
  formatJalaliDay,
  gregorianUtcFromJalali,
  type JalaliDate,
} from "@/lib/dates/tehran";
import { simulateGoalCompletion } from "@/lib/finance/whatIf";

export function GoalWhatIf({
  currentAmount,
  targetAmount,
  remaining,
  monthlyNeed,
  today,
}: {
  currentAmount: string;
  targetAmount: string;
  remaining: string;
  monthlyNeed: string | null;
  today: JalaliDate;
}) {
  const remainingAmount = BigInt(remaining);
  const defaultSavings = defaultMonthlySavings(remainingAmount, monthlyNeed);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const [digits, setDigits] = useState(() =>
    defaultSavings > 0n ? defaultSavings.toString() : "",
  );
  const display = digits ? formatTomanInput(digits) : "";
  const monthlySavings = digits ? BigInt(digits) : 0n;
  const simulation = useMemo(
    () =>
      simulateGoalCompletion(
        {
          currentAmount: BigInt(currentAmount),
          targetAmount: BigInt(targetAmount),
          today: gregorianUtcFromJalali(today),
        },
        monthlySavings,
      ),
    [currentAmount, monthlySavings, targetAmount, today],
  );
  const sliderMax = sliderCeiling(remainingAmount, monthlySavings);
  const sliderStep = sliderIncrement(sliderMax);

  useLayoutEffect(() => {
    const input = inputRef.current;
    const caret = caretRef.current;
    if (!input || caret == null) {
      return;
    }
    input.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [display]);

  return (
    <section className="mt-4 rounded-2xl bg-surface-muted/80 px-3 py-3">
      <p className="text-sm leading-7">
        اگه ماهی{" "}
        <label className="inline-flex min-w-[8.5rem] items-center gap-1 align-middle">
          <span className="sr-only">پس‌انداز ماهانه</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            enterKeyHint="done"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            dir="ltr"
            aria-label="پس‌انداز ماهانه"
            placeholder="۰"
            value={display}
            onChange={(event) => {
              const next = applyTomanInputChange(
                event.target.value,
                event.target.selectionStart ?? event.target.value.length,
              );
              caretRef.current = next.caret;
              setDigits(next.digits);
            }}
            className="numeric-display h-8 w-full rounded-lg border border-border bg-card px-2 text-left text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
          <span className="text-xs text-muted-foreground">{CURRENCY_LABEL}</span>
        </label>{" "}
        پس‌انداز کنم
      </p>

      <input
        type="range"
        min={0}
        max={sliderMax}
        step={sliderStep}
        dir="ltr"
        disabled={remainingAmount <= 0n}
        value={Math.min(Number(monthlySavings), sliderMax)}
        onChange={(event) => {
          const next = Number(event.target.value);
          setDigits(next > 0 ? String(next) : "");
        }}
        aria-label="تنظیم پس‌انداز ماهانه"
        className="what-if-slider mt-3 w-full"
      />

      <p className="mt-3 text-sm leading-7" aria-live="polite">
        {goalWhatIfCopy(simulation, today)}
      </p>

      <WhyThisNumber className="mt-3">
        <dl className="space-y-2">
          <FormulaRow label="مبلغ فعلی" value={formatToman(BigInt(currentAmount))} />
          <FormulaRow label="مبلغ هدف" value={formatToman(BigInt(targetAmount))} />
          <FormulaRow label="مانده" value={formatToman(simulation.remaining)} />
          <FormulaRow
            label="پس‌انداز ماهانه"
            value={formatToman(simulation.hypotheticalMonthlySavings)}
          />
          <FormulaRow
            label="ماه تا رسیدن"
            value={
              simulation.monthsToComplete == null
                ? "—"
                : toPersianDigits(simulation.monthsToComplete)
            }
          />
        </dl>
        <p className="pt-1 text-xs leading-6 text-muted-foreground">
          ماه تا رسیدن ≈ مانده ÷ پس‌انداز ماهانه (رند به بالا)
          <br />
          تاریخ ≈ امروز + همان تعداد ماه در تقویم شمسی
        </p>
      </WhyThisNumber>
    </section>
  );
}

function defaultMonthlySavings(remaining: bigint, monthlyNeed: string | null): bigint {
  if (monthlyNeed != null) {
    const need = BigInt(monthlyNeed);
    if (need > 0n) {
      return need;
    }
  }
  if (remaining <= 0n) {
    return 0n;
  }
  const twelfth = remaining / 12n;
  return twelfth > 0n ? twelfth : remaining;
}

function sliderCeiling(remaining: bigint, monthlySavings: bigint): number {
  const peak = remaining > monthlySavings ? remaining : monthlySavings;
  if (peak <= 0n) {
    return 1;
  }
  return Number(peak);
}

function sliderIncrement(max: number): number {
  if (max >= 10_000_000) return 100_000;
  if (max >= 1_000_000) return 10_000;
  if (max >= 100_000) return 1_000;
  return 1;
}

function goalWhatIfCopy(
  simulation: ReturnType<typeof simulateGoalCompletion>,
  today: JalaliDate,
): string {
  if (simulation.alreadyComplete) {
    return "به این هدف رسیدی.";
  }
  if (!simulation.reachable || simulation.monthsToComplete == null || simulation.projectedJalali == null) {
    return "با این مبلغ به هدف نمی‌رسی — عدد باید بیشتر از صفر باشد.";
  }
  const months = toPersianDigits(simulation.monthsToComplete);
  const date = formatJalaliDay(simulation.projectedJalali, today);
  return `به این هدف در ${months} ماه می‌رسی (حدود ${date}).`;
}
