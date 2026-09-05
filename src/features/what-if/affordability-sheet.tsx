"use client";

import { useMemo, useState } from "react";
import { Drawer } from "vaul";
import { FormulaRow, WhyThisNumber } from "@/components/finance/why-this-number";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { AmountKeypad } from "@/features/quick-add/amount-keypad";
import { useQuickAddStore } from "@/features/quick-add/store";
import { formatCompactToman, formatToman, toPersianDigits } from "@/lib/currency/format";
import { simulateHypotheticalExpense } from "@/lib/finance/whatIf";

export type AffordabilityBudget = {
  categoryId: string;
  name: string;
  spent: string;
  limit: string;
};

export type AffordabilitySnapshot = {
  availableMoney: string;
  remainingToday: string;
  spentToday: string;
  remainingDays: number;
  budgets: AffordabilityBudget[];
};

export function AffordabilitySheet({ snapshot }: { snapshot: AffordabilitySnapshot }) {
  const openQuickAdd = useQuickAddStore((state) => state.openDrawer);
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const amount = digits ? BigInt(digits) : 0n;
  const simulation = useMemo(() => {
    if (amount <= 0n) {
      return null;
    }
    return simulateHypotheticalExpense({
      currentAvailableMoney: BigInt(snapshot.availableMoney),
      currentDailyAllowance: BigInt(snapshot.remainingToday),
      spentToday: BigInt(snapshot.spentToday),
      daysRemaining: snapshot.remainingDays,
      hypotheticalAmount: amount,
      categoryId: categoryId || null,
      budgets: snapshot.budgets.map((item) => ({
        categoryId: item.categoryId,
        spent: BigInt(item.spent),
        limit: BigInt(item.limit),
      })),
    });
  }, [amount, categoryId, snapshot]);

  const budgetName =
    snapshot.budgets.find((item) => item.categoryId === simulation?.wouldExceedBudget?.categoryId)
      ?.name ?? null;
  const showResult = reviewed && simulation != null;

  function reset() {
    setDigits("");
    setCategoryId("");
    setReviewed(false);
  }

  function registerTransaction() {
    if (amount <= 0n) {
      return;
    }
    setOpen(false);
    reset();
    openQuickAdd({
      digits,
      categoryId: categoryId || null,
    });
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Trigger asChild>
        <button
          type="button"
          className="mt-4 text-sm text-primary"
        >
          می‌تونم این رو بخرم؟
        </button>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="px-5 text-base font-semibold">می‌تونم این رو بخرم؟</Drawer.Title>
          <p className="mt-1 px-5 text-xs leading-6 text-muted-foreground">
            فقط شبیه‌سازی است. با بررسی هیچ تراکنشی ثبت نمی‌شود.
          </p>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
            <p className="numeric-display text-center text-4xl font-semibold tracking-tight">
              {amount > 0n ? formatToman(amount) : toPersianDigits("0 تومان")}
            </p>
            <div className="mt-5">
              <AmountKeypad
                onDigit={(digit) => {
                  setDigits((current) =>
                    `${current}${digit}`.replace(/^0+(?=\d)/, "").slice(0, 15),
                  );
                }}
                onThousand={() => {
                  setDigits((current) =>
                    `${current || "0"}000`.replace(/^0+(?=\d)/, "").slice(0, 15),
                  );
                }}
                onBackspace={() => {
                  setDigits((current) => current.slice(0, -1));
                }}
              />
            </div>

            {snapshot.budgets.length > 0 ? (
              <div className="mt-4">
                <NativeSelect
                  aria-label="دسته (اختیاری)"
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value);
                  }}
                >
                  <option value="">بدون دسته — اختیاری</option>
                  {snapshot.budgets.map((item) => (
                    <option key={item.categoryId} value={item.categoryId}>
                      {item.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}

            <Button
              type="button"
              className="mt-5 w-full"
              disabled={amount <= 0n}
              onClick={() => setReviewed(true)}
            >
              بررسی
            </Button>

            {showResult && simulation ? (
              <div className="mt-5 flex flex-col gap-3" aria-live="polite">
                <p className="text-[15px] leading-7">
                  اگه این {formatCompactToman(simulation.hypotheticalAmount)} رو خرج کنی، امروز{" "}
                  {formatCompactToman(simulation.newDailyAllowance)} برات می‌مونه (به‌جای{" "}
                  {formatCompactToman(simulation.previousDailyAllowance)}).
                </p>
                <p className="text-sm leading-7 text-foreground/70">
                  {availableMoneyCopy(simulation.newAvailableMoney, simulation.previousAvailableMoney)}
                </p>
                {simulation.wouldExceedBudget && budgetName ? (
                  <p className="text-sm leading-7 text-foreground/70">
                    این خرید بودجه‌ی «{budgetName}» رو{" "}
                    {formatCompactToman(simulation.wouldExceedBudget.amountOver)} رد می‌کنه.
                  </p>
                ) : null}

                <WhyThisNumber>
                  <dl className="space-y-2">
                    <FormulaRow
                      label="قابل‌خرج فعلی"
                      value={formatToman(simulation.previousAvailableMoney)}
                    />
                    <FormulaRow label="مبلغ فرضی" value={formatToman(simulation.hypotheticalAmount)} prefix="− " />
                    <FormulaRow
                      label="قابل‌خرج بعد از خرید"
                      value={formatToman(simulation.newAvailableMoney)}
                    />
                    <FormulaRow
                      label="خرج امروز"
                      value={formatToman(BigInt(snapshot.spentToday))}
                    />
                    <FormulaRow
                      label="روزهای باقی‌مانده"
                      value={toPersianDigits(simulation.remainingDays)}
                    />
                    <FormulaRow
                      label="سهم هر روز"
                      value={formatToman(simulation.dailyShare)}
                    />
                    <FormulaRow
                      label="مانده امروز فعلی"
                      value={formatToman(simulation.previousDailyAllowance)}
                    />
                    <FormulaRow
                      label="مانده امروز بعد از خرید"
                      value={formatToman(simulation.newDailyAllowance)}
                    />
                  </dl>
                  <p className="pt-1 text-xs leading-6 text-muted-foreground">
                    قابل‌خرج جدید = قابل‌خرج فعلی − مبلغ فرضی
                    <br />
                    مانده امروز = سهم هر روز − خرج امروز − مبلغ فرضی
                  </p>
                </WhyThisNumber>

                <Button type="button" variant="secondary" className="w-full" onClick={registerTransaction}>
                  ثبت این تراکنش
                </Button>
              </div>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function availableMoneyCopy(next: bigint, previous: bigint): string {
  if (next === previous) {
    return `قابل‌خرج این دوره ${formatCompactToman(previous)} می‌ماند.`;
  }
  if (next < 0n) {
    return `قابل‌خرج این دوره ${formatCompactToman(-next)} کسری می‌آید (الان ${formatCompactToman(previous)} است).`;
  }
  return `قابل‌خرج این دوره می‌شه ${formatCompactToman(next)} (الان ${formatCompactToman(previous)}).`;
}
