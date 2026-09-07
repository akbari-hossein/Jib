"use client";

import { useActionState, useMemo, useState } from "react";
import { createRecurring, type RecurringActionState } from "@/server/actions/recurring";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { FREQUENCY_LABEL, TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CategoryKind, RecurringFrequency } from "@prisma/client";

const initial: RecurringActionState = { ok: false };
const TYPES = ["EXPENSE", "INCOME"] as const;
const FREQUENCIES: RecurringFrequency[] = ["MONTHLY", "WEEKLY", "YEARLY"];

export function RecurringForm({
  accounts,
  categories,
}: {
  accounts: { id: string; name: string }[];
  categories: { id: string; name: string; kind: CategoryKind }[];
}) {
  const [state, action, pending] = useActionState(createRecurring, initial);
  const [type, setType] = useState<(typeof TYPES)[number]>("EXPENSE");
  const today = getTehranJalaliDate();
  const visibleCategories = useMemo(
    () =>
      categories.filter((category) =>
        type === "INCOME"
          ? category.kind === "INCOME" || category.kind === "BOTH"
          : category.kind === "EXPENSE" || category.kind === "BOTH",
      ),
    [categories, type],
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="recurring-name">نام</Label>
        <Input id="recurring-name" name="name" placeholder="مثلاً اجاره" required maxLength={60} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">نوع</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((item) => (
            <label
              key={item}
              className={cn(
                "cursor-pointer rounded-full bg-surface-muted px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input
                type="radio"
                name="type"
                value={item}
                checked={type === item}
                onChange={() => setType(item)}
                className="sr-only"
              />
              {TRANSACTION_TYPE_LABEL[item]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">مبلغ</Label>
        <MoneyInput id="amount" name="amount" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="frequency">دوره</Label>
        <NativeSelect id="frequency" name="frequency" defaultValue="MONTHLY">
          {FREQUENCIES.map((frequency) => (
            <option key={frequency} value={frequency}>
              {FREQUENCY_LABEL[frequency]}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="categoryId">دسته‌بندی</Label>
        <NativeSelect id="categoryId" name="categoryId" required>
          <option value="">انتخاب کن</option>
          {visibleCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="accountId">حساب</Label>
        <NativeSelect id="accountId" name="accountId" required>
          <option value="">انتخاب کن</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label>شروع از</Label>
        <JalaliDateFields prefix="start" defaultValue={today} minYear={today.year - 1} maxYear={today.year + 2} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "افزودن تکراری"}
      </Button>
    </form>
  );
}
