"use client";

import { useState } from "react";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import type { AccountOption } from "@/features/debts/types";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { settleContact, settleDebt, type DebtActionState } from "@/server/actions/debts";

const initial: DebtActionState = { ok: false };

export function SettleForm({
  mode,
  id,
  defaultAmount,
  accounts,
  onSuccess,
}: {
  mode: "debt" | "contact";
  id: string;
  defaultAmount: string;
  accounts: AccountOption[];
  onSuccess?: () => void;
}) {
  const today = getTehranJalaliDate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result =
      mode === "debt" ? await settleDebt(initial, formData) : await settleContact(initial, formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "تسویه انجام نشد.");
      return;
    }
    onSuccess?.();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {mode === "debt" ? (
        <input type="hidden" name="id" value={id} />
      ) : (
        <input type="hidden" name="contactId" value={id} />
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="settle-amount">مبلغ</Label>
        <MoneyInput id="settle-amount" name="amount" defaultValue={defaultAmount} required />
        <p className="text-xs leading-6 text-foreground/45">می‌توانی کمتر از باقیمانده بدهی تا بخشی تسویه شود.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="settle-account">حساب (اختیاری)</Label>
        <NativeSelect id="settle-account" name="accountId">
          <option value="">بدون تغییر موجودی حساب</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="settle-note">یادداشت (اختیاری)</Label>
        <Input id="settle-note" name="note" maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>تاریخ</Label>
        <JalaliDateFields prefix="date" defaultValue={today} minYear={today.year - 2} maxYear={today.year + 1} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ثبت تسویه"}
      </Button>
    </form>
  );
}
