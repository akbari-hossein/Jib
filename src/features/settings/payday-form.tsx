"use client";

import { useActionState } from "react";
import { updateIncomeDay } from "@/server/actions/income-cycle";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toPersianDigits } from "@/lib/currency/format";

export function PaydayForm({ incomeDayOfMonth }: { incomeDayOfMonth: number | null }) {
  const [state, action, pending] = useActionState(updateIncomeDay, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="incomeDayOfMonth">روز درآمد در ماه</Label>
        <select
          id="incomeDayOfMonth"
          name="incomeDayOfMonth"
          defaultValue={incomeDayOfMonth == null ? "" : String(incomeDayOfMonth)}
          className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-base outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <option value="">پایان ماه</option>
          {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
            <option key={day} value={day}>
              {toPersianDigits(day)}
            </option>
          ))}
        </select>
        <p className="text-xs leading-6 text-foreground/45">
          اگر روز درآمد را نگذاری، سهم روزانه تا پایان ماه حساب می‌شود.
        </p>
      </div>
      {state?.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-sm text-income">ذخیره شد.</p> : null}
      <Button type="submit" variant="secondary" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ذخیره روز درآمد"}
      </Button>
    </form>
  );
}
