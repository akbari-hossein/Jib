"use client";

import { useActionState, useEffect } from "react";
import { createAccount, type AccountActionState } from "@/server/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";

const TYPES = ["CASH", "BANK", "CARD", "SAVINGS", "OTHER"] as const;
const initial: AccountActionState = { ok: false };

export function AccountForm({ onCreated }: { onCreated?: () => void }) {
  const [state, action, pending] = useActionState(createAccount, initial);

  useEffect(() => {
    if (state.ok) {
      onCreated?.();
    }
  }, [onCreated, state.ok]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-name">نام حساب</Label>
        <Input id="account-name" name="name" placeholder="مثلاً کارت ملت" required maxLength={60} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">نوع</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type, index) => (
            <label
              key={type}
              className={cn(
                "cursor-pointer rounded-full bg-surface-muted px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input
                type="radio"
                name="type"
                value={type}
                defaultChecked={index === 2}
                className="sr-only"
              />
              {ACCOUNT_TYPE_LABEL[type]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-balance">موجودی فعلی</Label>
        <Input
          id="account-balance"
          name="balance"
          inputMode="numeric"
          dir="ltr"
          defaultValue="0"
          className="text-left"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : "افزودن حساب"}
      </Button>
    </form>
  );
}
