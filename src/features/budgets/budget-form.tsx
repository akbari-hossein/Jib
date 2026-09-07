"use client";

import { useActionState, useMemo, useState } from "react";
import {
  upsertBudgetCategory,
  updateOverallLimit,
  type BudgetActionState,
} from "@/server/actions/budgets";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatToman } from "@/lib/currency/format";
import {
  categoryBudgetOverCopy,
  overallBelowAllocatedCopy,
} from "@/lib/finance/budget-allocation-copy";
import {
  isCategoryLimitAllowed,
  isOverallLimitAllowed,
  remainingAllocatable,
} from "@/lib/finance/budget-allocation";

const initial: BudgetActionState = { ok: false };

export function BudgetCategoryForm({
  categories,
  items,
  overallLimit,
}: {
  categories: { id: string; name: string }[];
  items: { categoryId: string; limit: string }[];
  overallLimit: string | null;
}) {
  const [state, action, pending] = useActionState(upsertBudgetCategory, initial);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState<bigint | null>(null);

  const overall = overallLimit == null ? null : BigInt(overallLimit);
  const currentItem = items.find((item) => item.categoryId === categoryId);
  const otherLimits = items
    .filter((item) => item.categoryId !== categoryId)
    .map((item) => BigInt(item.limit));
  const remaining = remainingAllocatable(overall, otherLimits);
  const overLimit =
    amount != null && !isCategoryLimitAllowed(overall, amount, otherLimits);
  const inlineError =
    overLimit && remaining != null ? categoryBudgetOverCopy(remaining) : null;

  if (categories.length === 0) {
    return null;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">دسته</Label>
        <NativeSelect
          id="categoryId"
          name="categoryId"
          required
          value={categoryId}
          onChange={(event) => {
            const next = event.target.value;
            setCategoryId(next);
            const item = items.find((row) => row.categoryId === next);
            setAmount(item ? BigInt(item.limit) : null);
          }}
        >
          <option value="">انتخاب کن</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      {overall != null ? (
        <p className="text-sm leading-7 text-foreground/60">
          بودجه باقی‌مانده
          <span className="mt-0.5 block numeric-display text-base font-semibold text-foreground">
            {formatToman(remaining && remaining > 0n ? remaining : 0n)}
          </span>
        </p>
      ) : (
        <p className="text-xs leading-6 text-foreground/45">
          سقف کل ماه مشخص نیست، پس محدودیت جمع دسته‌ها اعمال نمی‌شود.
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="limit">{currentItem ? "سقف این ماه (ویرایش)" : "سقف این ماه"}</Label>
        <MoneyInput
          key={categoryId || "new"}
          id="limit"
          name="limit"
          required
          defaultValue={currentItem?.limit}
          invalid={overLimit}
          onAmountChange={setAmount}
        />
      </div>
      {inlineError ? (
        <p role="alert" className="text-sm text-destructive">
          {inlineError}
        </p>
      ) : null}
      {state.error && state.error !== inlineError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || overLimit} className="w-full">
        {pending ? "در حال ذخیره…" : currentItem ? "به‌روز کردن سقف" : "ذخیره سقف"}
      </Button>
    </form>
  );
}

export function OverallLimitForm({
  overallLimit,
  allocated,
}: {
  overallLimit: string;
  allocated: string;
}) {
  const [state, action, pending] = useActionState(updateOverallLimit, initial);
  const [amount, setAmount] = useState<bigint | null>(() =>
    overallLimit === "" ? null : BigInt(overallLimit),
  );

  const allocatedAmount = BigInt(allocated);
  const nextLimit = amount;
  const invalid =
    nextLimit != null && !isOverallLimitAllowed(nextLimit, [allocatedAmount]);
  const inlineError = useMemo(() => {
    if (!invalid || nextLimit == null) {
      return null;
    }
    return overallBelowAllocatedCopy(allocatedAmount, nextLimit);
  }, [allocatedAmount, invalid, nextLimit]);

  return (
    <form action={action} className="flex flex-col gap-4">
      {allocatedAmount > 0n ? (
        <p className="text-sm leading-7 text-foreground/60">
          مجموع بودجه دسته‌ها
          <span className="mt-0.5 block numeric-display text-base font-semibold text-foreground">
            {formatToman(allocatedAmount)}
          </span>
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="overallLimit">سقف کل ماه</Label>
        <MoneyInput
          id="overallLimit"
          name="overallLimit"
          defaultValue={overallLimit}
          placeholder="خالی = بدون سقف کل"
          invalid={invalid}
          onAmountChange={setAmount}
        />
      </div>
      {inlineError ? (
        <p role="alert" className="text-sm text-destructive">
          {inlineError}
        </p>
      ) : null}
      {state.error && state.error !== inlineError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={pending || invalid} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره سقف کل"}
      </Button>
    </form>
  );
}
