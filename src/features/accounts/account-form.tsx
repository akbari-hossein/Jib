"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { AccountIconMark } from "@/features/accounts/account-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { NativeSelect } from "@/components/ui/native-select";
import { ACCOUNT_COLORS, ACCOUNT_ICONS, ACCOUNT_ICON_LABEL } from "@/lib/accounts/appearance";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { createAccount, updateAccount } from "@/server/actions/accounts";
import type { AccountListItem } from "@/server/queries/accounts";
import {
  REFERENCE_ASSET_OPTION_LABEL,
  REFERENCE_ASSET_TYPES,
} from "@/lib/finance/purchasing-power";

const TYPES = ["CASH", "BANK", "CARD", "SAVINGS", "ASSET_HOLDING", "OTHER"] as const;

export function AccountForm({
  account,
  onSuccess,
}: {
  account?: AccountListItem;
  onSuccess?: () => void;
}) {
  const isEdit = Boolean(account);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [icon, setIcon] = useState(account?.icon ?? "");
  const [color, setColor] = useState(account?.color ?? "");
  const [type, setType] = useState<(typeof TYPES)[number]>(account?.type ?? "CARD");
  const isAsset = type === "ASSET_HOLDING";
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await (isEdit ? updateAccount : createAccount)(undefined, formData);
      if (!result.ok) {
        setError(result.error ?? "ذخیره حساب انجام نشد. دوباره تلاش کن.");
        return;
      }
      toast.success(isEdit ? "حساب ذخیره شد." : "حساب اضافه شد.");
      if (!isEdit) {
        formRef.current?.reset();
        setIcon("");
        setColor("");
      }
      onSuccess?.();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
      {account ? <input type="hidden" name="id" value={account.id} /> : null}
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="flex flex-col gap-2">
        <Label htmlFor={isEdit ? "edit-account-name" : "account-name"}>نام حساب</Label>
        <Input
          id={isEdit ? "edit-account-name" : "account-name"}
          name="name"
          placeholder="مثلاً کارت ملت"
          required
          maxLength={60}
          defaultValue={account?.name}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">نوع</legend>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((typeOption) => (
            <label
              key={typeOption}
              className="cursor-pointer rounded-full bg-surface-muted px-3 py-2 text-sm has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
            >
              <input
                type="radio"
                name="type"
                value={typeOption}
                checked={type === typeOption}
                onChange={() => setType(typeOption)}
                className="sr-only"
              />
              {ACCOUNT_TYPE_LABEL[typeOption]}
            </label>
          ))}
        </div>
      </fieldset>

      {isAsset ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor={isEdit ? "edit-asset-type" : "asset-type"}>نوع دارایی</Label>
            <NativeSelect
              id={isEdit ? "edit-asset-type" : "asset-type"}
              name="assetType"
              defaultValue={account?.assetType ?? "GOLD_COIN"}
            >
              {REFERENCE_ASSET_TYPES.map((asset) => (
                <option key={asset} value={asset}>
                  {REFERENCE_ASSET_OPTION_LABEL[asset]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={isEdit ? "edit-account-quantity" : "account-quantity"}>مقدار</Label>
            <Input
              id={isEdit ? "edit-account-quantity" : "account-quantity"}
              name="quantity"
              inputMode="decimal"
              defaultValue={account?.quantity ?? "0"}
              placeholder="مثلاً ۲٫۵"
            />
            <p className="text-xs leading-6 text-foreground/45">
              مقدار فیزیکی است — گرم، سکه، یا واحد ارز. ارزش تومان از نرخ روز حساب می‌شود.
            </p>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor={isEdit ? "edit-account-balance" : "account-balance"}>موجودی فعلی</Label>
          <MoneyInput
            id={isEdit ? "edit-account-balance" : "account-balance"}
            name="balance"
            defaultValue={account?.type === "ASSET_HOLDING" ? "0" : (account?.balance ?? "0")}
            allowNegative
          />
          {isEdit ? (
            <p className="text-xs leading-6 text-foreground/45">
              موجودی را دستی عوض کن؛ این کار تراکنش جدید نمی‌سازد.
            </p>
          ) : null}
        </div>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">آیکون</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_ICONS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon((current) => (current === name ? "" : name))}
              className={cn(
                "flex size-11 items-center justify-center rounded-full border transition-colors",
                icon === name ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-muted",
              )}
              aria-pressed={icon === name}
              aria-label={ACCOUNT_ICON_LABEL[name]}
            >
              <AccountIconMark name={name} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">رنگ</legend>
        <div className="flex flex-wrap gap-2">
          {ACCOUNT_COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColor((current) => (current === item.value ? "" : item.value))}
              className={cn(
                "size-8 rounded-full border-2 transition-transform",
                color === item.value ? "scale-110 border-foreground" : "border-transparent",
              )}
              style={{ background: item.value }}
              aria-pressed={color === item.value}
              aria-label={item.id}
            />
          ))}
        </div>
      </fieldset>

      {account ? (
        <label className="flex items-start gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm leading-6">
          <input
            type="checkbox"
            name="includeInAvailable"
            defaultChecked={account.includeInAvailable}
            className="mt-1 size-4 accent-primary"
          />
          <span>
            در قابل‌خرج خانه حساب شود
            <span className="mt-1 block text-xs text-foreground/45">
              حساب‌های پس‌انداز و دارایی معمولاً خارج می‌مانند تا عدد امروز را شلوغ نکنند.
            </span>
          </span>
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "در حال ذخیره…" : isEdit ? "ذخیره تغییرات" : "افزودن حساب"}
      </Button>
    </form>
  );
}
