"use client";

import { useState } from "react";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import { ContactPicker } from "@/features/debts/contact-picker";
import type { AccountOption, ContactOption } from "@/features/debts/types";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { cn } from "@/lib/utils";
import { createDebt, type DebtActionState } from "@/server/actions/debts";

const initial: DebtActionState = { ok: false };

export function DebtForm({
  contacts,
  accounts,
  defaultContactId,
  onSuccess,
}: {
  contacts: ContactOption[];
  accounts: AccountOption[];
  defaultContactId?: string;
  onSuccess?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gave, setGave] = useState(true);
  const today = getTehranJalaliDate();

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createDebt(initial, formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "ذخیره انجام نشد.");
      return;
    }
    onSuccess?.();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="type" value={gave ? "OWED_TO_ME" : "I_OWE"} />
      <div className="flex flex-col gap-2">
        <Label>طرف مقابل</Label>
        <ContactPicker contacts={contacts} selectedId={defaultContactId} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="debt-amount">مبلغ</Label>
        <MoneyInput id="debt-amount" name="amount" required />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">جهت</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setGave(true)}
            className={cn(
              "h-12 rounded-2xl text-sm",
              gave ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            من دادم
          </button>
          <button
            type="button"
            onClick={() => setGave(false)}
            className={cn(
              "h-12 rounded-2xl text-sm",
              !gave ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            من گرفتم
          </button>
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="debt-reason">بابت چی؟ (اختیاری)</Label>
        <Input id="debt-reason" name="reason" maxLength={120} placeholder="مثلاً کرایه تاکسی" />
      </div>
      <div className="flex flex-col gap-2">
        <Label>تاریخ</Label>
        <JalaliDateFields prefix="date" defaultValue={today} minYear={today.year - 2} maxYear={today.year + 1} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="debt-account">حساب (اختیاری)</Label>
        <NativeSelect id="debt-account" name="accountId">
          <option value="">بدون تغییر موجودی حساب</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </NativeSelect>
        <p className="text-xs leading-6 text-foreground/45">
          اگر حساب وصل کنی، موجودی جابه‌جا می‌شود ولی به‌عنوان هزینه یا درآمد ثبت نمی‌شود.
        </p>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "ثبت دنگ"}
      </Button>
    </form>
  );
}
