"use client";

import { useActionState, useState } from "react";
import { createGoal, type GoalActionState } from "@/server/actions/goals";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import { getTehranJalaliDate } from "@/lib/dates/tehran";

const initial: GoalActionState = { ok: false };

export function GoalForm({
  accounts,
}: {
  accounts: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createGoal, initial);
  const [linked, setLinked] = useState(false);
  const today = getTehranJalaliDate();

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="goal-name">نام هدف</Label>
        <Input id="goal-name" name="name" placeholder="مثلاً سفر شمال" required maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="targetAmount">مبلغ هدف</Label>
        <MoneyInput id="targetAmount" name="targetAmount" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="accountId">حساب پس‌انداز (اختیاری)</Label>
        <NativeSelect
          id="accountId"
          name="accountId"
          onChange={(event) => setLinked(event.target.value !== "")}
        >
          <option value="">بدون حساب — رزرو از قابل‌خرج</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs leading-6 text-foreground/45">
          اگر حساب وصل کنی، موجودی همان حساب پیشرفت است و دوباره از قابل‌خرج کم نمی‌شود.
        </p>
      </div>
      {linked ? null : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="currentAmount">مبلغ فعلی</Label>
          <MoneyInput id="currentAmount" name="currentAmount" defaultValue="0" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>تاریخ هدف (اختیاری)</Label>
        <JalaliDateFields prefix="target" optional minYear={today.year} maxYear={today.year + 10} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "افزودن هدف"}
      </Button>
    </form>
  );
}
