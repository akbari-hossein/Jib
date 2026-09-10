"use client";

import { useMemo, useState } from "react";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import type { AccountOption, ContactOption } from "@/features/debts/types";
import { formatToman } from "@/lib/currency/format";
import { parseTomanInput } from "@/lib/currency/input";
import { getTehranJalaliDate } from "@/lib/dates/tehran";
import { splitAmountEvenly } from "@/lib/finance/debts";
import { cn } from "@/lib/utils";
import { createSplitBill, type DebtActionState } from "@/server/actions/debts";

const initial: DebtActionState = { ok: false };

type DraftPerson = {
  key: string;
  contactId: string;
  name: string;
  amount: string;
};

export function SplitBillForm({
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
  const today = getTehranJalaliDate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paidByMe, setPaidByMe] = useState(true);
  const [method, setMethod] = useState<"EQUAL" | "CUSTOM">("EQUAL");
  const [total, setTotal] = useState<bigint | null>(null);
  const [myShare, setMyShare] = useState<bigint | null>(null);
  const [people, setPeople] = useState<DraftPerson[]>(() => {
    const preset = contacts.find((contact) => contact.id === defaultContactId);
    return preset
      ? [{ key: preset.id, contactId: preset.id, name: preset.name, amount: "" }]
      : [];
  });
  const [nextName, setNextName] = useState("");

  const headCount = people.length + 1;
  const evenShares = useMemo(() => {
    if (total == null || headCount < 2) {
      return [];
    }
    try {
      return splitAmountEvenly(total, headCount);
    } catch {
      return [];
    }
  }, [headCount, total]);

  function addPerson() {
    const name = nextName.trim();
    if (!name) {
      return;
    }
    const existing = contacts.find((contact) => contact.name === name);
    const already = people.some(
      (person) => person.name === name || (existing && person.contactId === existing.id),
    );
    if (already) {
      setNextName("");
      return;
    }
    setPeople((current) => [
      ...current,
      {
        key: existing?.id ?? `new-${name}`,
        contactId: existing?.id ?? "",
        name: existing?.name ?? name,
        amount: "",
      },
    ]);
    setNextName("");
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    formData.set("paidByMe", paidByMe ? "true" : "false");
    formData.set("method", method);
    formData.set("includeMe", "true");
    formData.set(
      "participants",
      JSON.stringify(
        people.map((person) => ({
          contactId: person.contactId || undefined,
          name: person.name,
          amount: person.amount,
        })),
      ),
    );
    const result = await createSplitBill(initial, formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "ذخیره انجام نشد.");
      return;
    }
    onSuccess?.();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="split-title">عنوان</Label>
        <Input id="split-title" name="title" required maxLength={80} placeholder="مثلاً شام با دوستان" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="split-total">مبلغ کل</Label>
        <MoneyInput id="split-total" name="totalAmount" required onAmountChange={setTotal} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">پرداخت‌کننده</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPaidByMe(true)}
            className={cn(
              "h-12 rounded-2xl text-sm",
              paidByMe ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            من پرداختم
          </button>
          <button
            type="button"
            onClick={() => setPaidByMe(false)}
            className={cn(
              "h-12 rounded-2xl text-sm",
              !paidByMe ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            کس دیگری پرداخت
          </button>
        </div>
      </fieldset>
      {paidByMe ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="split-account">حساب منبع (اختیاری)</Label>
          <NativeSelect id="split-account" name="accountId">
            <option value="">بدون تغییر موجودی حساب</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </NativeSelect>
          <p className="text-xs leading-6 text-foreground/45">
            سهم بقیه از موجودی این حساب کم می‌شود. سهم خودت را جدا به‌عنوان هزینه ثبت کن.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="payerContactId">چه کسی پرداخت کرد؟</Label>
          <NativeSelect id="payerContactId" name="payerContactId" required={people.length > 0}>
            <option value="">انتخاب کن</option>
            {people.map((person) => (
              <option key={person.key} value={person.contactId || person.name}>
                {person.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>افراد</Label>
        <ul className="flex flex-col gap-2">
          <li className="rounded-2xl bg-surface-muted px-4 py-3 text-sm">تو</li>
          {people.map((person) => (
            <li key={person.key} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 rounded-2xl bg-surface-muted px-4 py-3 text-sm">
                {person.name}
              </span>
              {method === "CUSTOM" ? (
                <MoneyInput
                  name={`share-${person.key}`}
                  className="h-12"
                  onAmountChange={(amount) => {
                    setPeople((current) =>
                      current.map((item) =>
                        item.key === person.key
                          ? { ...item, amount: amount == null ? "" : amount.toString() }
                          : item,
                      ),
                    );
                  }}
                />
              ) : null}
              <button
                type="button"
                className="text-xs text-foreground/45"
                onClick={() => setPeople((current) => current.filter((item) => item.key !== person.key))}
              >
                حذف
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={nextName}
            onChange={(event) => setNextName(event.target.value)}
            placeholder="نام فرد"
            list="split-contact-options"
          />
          <datalist id="split-contact-options">
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.name} />
            ))}
          </datalist>
          <Button type="button" variant="secondary" onClick={addPerson}>
            افزودن
          </Button>
        </div>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">روش تقسیم</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMethod("EQUAL")}
            className={cn(
              "h-12 rounded-2xl text-sm",
              method === "EQUAL" ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            برابر
          </button>
          <button
            type="button"
            onClick={() => setMethod("CUSTOM")}
            className={cn(
              "h-12 rounded-2xl text-sm",
              method === "CUSTOM" ? "bg-primary text-primary-foreground" : "bg-surface-muted",
            )}
          >
            سفارشی
          </button>
        </div>
      </fieldset>
      {method === "CUSTOM" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="myShare">سهم تو</Label>
          <MoneyInput id="myShare" name="myShare" allowZero onAmountChange={setMyShare} />
        </div>
      ) : null}
      {method === "EQUAL" && evenShares.length > 0 ? (
        <div className="rounded-2xl bg-surface-muted px-4 py-3 text-sm leading-7">
          <p>سهم تو: {formatToman(evenShares[0]!)}</p>
          {people.map((person, index) => (
            <p key={person.key}>
              {person.name}: {formatToman(evenShares[index + 1] ?? 0n)}
            </p>
          ))}
        </div>
      ) : null}
      {method === "CUSTOM" && total != null ? (
        <p className="text-xs leading-6 text-muted-foreground">
          جمع سهم‌ها باید دقیقاً {formatToman(total)} شود
          {myShare != null
            ? ` · الان ${formatToman(
                myShare +
                  people.reduce((sum, person) => sum + (parseTomanInput(person.amount, { allowZero: true }) ?? 0n), 0n),
              )}`
            : ""}
          .
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label>تاریخ</Label>
        <JalaliDateFields prefix="date" defaultValue={today} minYear={today.year - 2} maxYear={today.year + 1} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending || people.length < 1} className="w-full">
        {pending ? "در حال ذخیره…" : "ثبت تقسیم"}
      </Button>
    </form>
  );
}
