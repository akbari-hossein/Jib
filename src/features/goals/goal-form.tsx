"use client";

import { useActionState, useState } from "react";
import { createGoal, type GoalActionState } from "@/server/actions/goals";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { getTehranJalaliDate } from "@/lib/dates/tehran";

const initial: GoalActionState = { ok: false };

export function GoalForm({
  accounts,
}: {
  accounts: { id: string; name: string; type: string }[];
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
      {accounts.length > 0 ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">حساب‌های تأمین‌کننده (اختیاری)</legend>
          <p className="text-xs leading-6 text-foreground/45">
            می‌توانی حساب پس‌انداز یا دارایی (طلا/ارز) وصل کنی. پیشرفت هدف با ارزش امروز همان حساب‌هاست.
          </p>
          {accounts.map((account) => (
            <label key={account.id} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                name="fundingAccountId"
                value={account.id}
                className="size-4 accent-primary"
                onChange={(event) => {
                  const form = event.currentTarget.form;
                  const checked = form
                    ? [...form.querySelectorAll<HTMLInputElement>('input[name="fundingAccountId"]')].some(
                        (input) => input.checked,
                      )
                    : event.currentTarget.checked;
                  setLinked(checked);
                }}
              />
              <span>
                {account.name}
                {account.type === "ASSET_HOLDING" ? " · دارایی" : ""}
              </span>
            </label>
          ))}
        </fieldset>
      ) : null}
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
