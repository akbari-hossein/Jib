"use client";

import { useMemo, useState, useTransition } from "react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { AmountKeypad } from "@/features/quick-add/amount-keypad";
import { isAssetQuickAdd, useQuickAddStore } from "@/features/quick-add/store";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { matchTransactionRule } from "@/lib/finance/rules";
import { REFERENCE_ASSET_UNIT_LABEL, type ReferenceAssetType } from "@/lib/finance/purchasing-power";
import { formatQuantity, parseQuantityToScaled } from "@/lib/finance/quantity";
import { CATEGORY_GROUP_LABEL } from "@/lib/labels";
import { createAssetMovement, createQuickTransaction } from "@/server/actions/transactions";
import type { QuickAddContext } from "@/server/queries/quick-add";
import { cn } from "@/lib/utils";

const MONEY_TYPES = [
  { id: "EXPENSE", label: "هزینه" },
  { id: "INCOME", label: "درآمد" },
  { id: "TRANSFER", label: "جابه‌جایی" },
] as const;

const ASSET_TYPES = [
  { id: "ASSET_ADD", label: "افزایش دارایی" },
  { id: "ASSET_REMOVE", label: "کاهش دارایی" },
] as const;

function quantityDisplay(digits: string): string {
  const scaled = parseQuantityToScaled(digits.replace(/٫/g, "."));
  if (scaled == null) {
    return toPersianDigits("0");
  }
  return formatQuantity(scaled);
}

export function QuickAddDrawer({ context }: { context: QuickAddContext }) {
  const store = useQuickAddStore();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isAsset = isAssetQuickAdd(store.type);
  const amount = !isAsset && store.digits ? BigInt(store.digits) : 0n;
  const quantityOk = isAsset && (parseQuantityToScaled(store.digits) ?? 0n) > 0n;
  const types = context.holdings.length > 0 ? [...MONEY_TYPES, ...ASSET_TYPES] : MONEY_TYPES;

  const categories = context.categories.filter((category) => {
    if (store.type === "INCOME") {
      return category.kind === "INCOME" || category.kind === "BOTH";
    }
    return category.kind === "EXPENSE" || category.kind === "BOTH";
  });

  const matchedRule = useMemo(
    () => matchTransactionRule({ merchant: store.merchant }, context.rules),
    [context.rules, store.merchant],
  );

  const selectedCategoryId =
    store.categoryId ??
    matchedRule?.categoryId ??
    (store.type === "INCOME" ? context.lastUsed.incomeCategoryId : context.lastUsed.expenseCategoryId);

  const selectedAccountId =
    store.accountId ??
    matchedRule?.accountId ??
    (store.type === "INCOME" ? context.lastUsed.incomeAccountId : context.lastUsed.expenseAccountId) ??
    context.accounts[0]?.id ??
    null;

  const selectedHoldingId = store.accountId ?? context.holdings[0]?.id ?? null;
  const selectedHolding = context.holdings.find((holding) => holding.id === selectedHoldingId) ?? null;
  const unitLabel =
    selectedHolding?.assetType && selectedHolding.assetType in REFERENCE_ASSET_UNIT_LABEL
      ? REFERENCE_ASSET_UNIT_LABEL[selectedHolding.assetType as ReferenceAssetType]
      : "واحد";

  function handleMerchantChange(value: string) {
    store.setMerchant(value);
    const rule = matchTransactionRule({ merchant: value }, context.rules);
    if (rule) {
      store.setCategoryId(rule.categoryId);
      if (rule.accountId) {
        store.setAccountId(rule.accountId);
      }
    }
  }

  function goNextFromAmount() {
    if (isAsset) {
      if (!quantityOk) {
        return;
      }
      store.goTo("account");
      return;
    }
    if (amount <= 0n) {
      return;
    }
    if (store.type === "TRANSFER") {
      store.goTo("account");
      return;
    }
    store.goTo("category");
  }

  function saveMoney() {
    if (!selectedAccountId) {
      setError("حساب را انتخاب کن.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createQuickTransaction({
        type: store.type === "TRANSFER" || store.type === "INCOME" || store.type === "EXPENSE" ? store.type : "EXPENSE",
        amount: store.digits,
        accountId: selectedAccountId,
        categoryId: selectedCategoryId ?? undefined,
        toAccountId: store.toAccountId ?? undefined,
        merchant: store.merchant || undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "ذخیره تراکنش انجام نشد. دوباره تلاش کن.");
        return;
      }
      toast.success("ثبت شد.");
      store.reset();
    });
  }

  function saveAsset() {
    if (!selectedHoldingId) {
      setError("حساب دارایی را انتخاب کن.");
      return;
    }
    if (store.type !== "ASSET_ADD" && store.type !== "ASSET_REMOVE") {
      return;
    }
    const movementType = store.type;
    if (movementType === "ASSET_REMOVE" && store.convertToCash && !store.toAccountId) {
      setError("حساب تومان را انتخاب کن.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createAssetMovement({
        type: movementType,
        quantity: store.digits,
        accountId: selectedHoldingId,
        convertToAccountId: store.convertToCash ? store.toAccountId ?? undefined : undefined,
      });
      if (!result.ok) {
        setError(result.error ?? "ذخیره دارایی انجام نشد. دوباره تلاش کن.");
        return;
      }
      toast.success("ثبت شد.");
      store.reset();
    });
  }

  return (
    <Drawer.Root
      open={store.open}
      onOpenChange={(open) => {
        if (open) {
          store.openDrawer();
          return;
        }
        store.closeDrawer();
      }}
      shouldScaleBackground={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/35" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] max-w-xl flex-col rounded-t-[1.6rem] border border-border bg-background outline-none">
          <Drawer.Handle className="mx-auto mt-3 mb-2 h-1.5 w-12 rounded-full bg-border" />
          <Drawer.Title className="sr-only">ثبت سریع تراکنش</Drawer.Title>
          <div className="flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
            {store.step === "amount" ? (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap gap-2">
                  {types.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => store.setType(item.id)}
                      className={cn(
                        "h-9 rounded-full px-3 text-sm transition-colors",
                        store.type === item.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-surface-muted text-foreground/70",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="numeric-display text-center text-4xl font-semibold tracking-tight">
                  {isAsset
                    ? `${quantityDisplay(store.digits)} ${unitLabel}`
                    : amount > 0n
                      ? formatToman(amount)
                      : toPersianDigits("0 تومان")}
                </p>
                <AmountKeypad
                  onDigit={store.appendDigit}
                  onThousand={store.appendThousand}
                  onBackspace={store.backspace}
                  decimal={isAsset}
                  onDecimal={store.appendDecimal}
                />
                <Button
                  type="button"
                  className="w-full"
                  disabled={isAsset ? !quantityOk : amount <= 0n}
                  onClick={goNextFromAmount}
                >
                  ادامه
                </Button>
              </div>
            ) : null}

            {store.step === "category" ? (
              <div className="flex flex-col gap-4">
                <button type="button" className="self-start text-sm text-foreground/55" onClick={() => store.goTo("amount")}>
                  بازگشت
                </button>
                <p className="numeric-display text-lg font-semibold">{formatToman(amount)}</p>
                <Input
                  value={store.merchant}
                  onChange={(event) => handleMerchantChange(event.target.value)}
                  placeholder="فروشنده — مثلاً اسنپ (اختیاری)"
                />
                <CategoryGrid
                  categories={categories}
                  selectedId={selectedCategoryId}
                  onSelect={(id) => {
                    store.setCategoryId(id);
                    store.goTo("account");
                  }}
                />
              </div>
            ) : null}

            {store.step === "account" && isAsset ? (
              <div className="flex flex-col gap-4">
                <button type="button" className="self-start text-sm text-foreground/55" onClick={() => store.goTo("amount")}>
                  بازگشت
                </button>
                <p className="numeric-display text-lg font-semibold">
                  {store.type === "ASSET_ADD" ? "+" : "−"}
                  {quantityDisplay(store.digits)} {unitLabel}
                </p>
                <p className="text-sm text-foreground/55">کدام دارایی؟</p>
                <HoldingList
                  holdings={context.holdings}
                  selectedId={selectedHoldingId}
                  onSelect={store.setAccountId}
                />
                {store.type === "ASSET_REMOVE" ? (
                  <Button type="button" className="w-full" disabled={!selectedHoldingId} onClick={() => store.goTo("convertTo")}>
                    ادامه
                  </Button>
                ) : (
                  <Button type="button" className="w-full" disabled={pending || !selectedHoldingId} onClick={saveAsset}>
                    {pending ? "در حال ذخیره…" : "ثبت"}
                  </Button>
                )}
              </div>
            ) : null}

            {store.step === "account" && !isAsset ? (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  className="self-start text-sm text-foreground/55"
                  onClick={() => store.goTo(store.type === "TRANSFER" ? "amount" : "category")}
                >
                  بازگشت
                </button>
                <p className="numeric-display text-lg font-semibold">{formatToman(amount)}</p>
                <p className="text-sm text-foreground/55">از کدام حساب؟</p>
                <AccountList
                  accounts={context.accounts}
                  selectedId={selectedAccountId}
                  onSelect={(id) => {
                    store.setAccountId(id);
                    if (store.type === "TRANSFER") {
                      store.goTo("transferTo");
                    }
                  }}
                />
                {store.type !== "TRANSFER" ? (
                  <Button type="button" className="w-full" disabled={pending || !selectedAccountId} onClick={saveMoney}>
                    {pending ? "در حال ذخیره…" : "ثبت"}
                  </Button>
                ) : null}
              </div>
            ) : null}

            {store.step === "transferTo" ? (
              <div className="flex flex-col gap-4">
                <button type="button" className="self-start text-sm text-foreground/55" onClick={() => store.goTo("account")}>
                  بازگشت
                </button>
                <p className="text-sm text-foreground/55">به کدام حساب؟</p>
                <AccountList
                  accounts={context.accounts.filter((account) => account.id !== store.accountId)}
                  selectedId={store.toAccountId}
                  onSelect={store.setToAccountId}
                />
                <Button
                  type="button"
                  className="w-full"
                  disabled={pending || !store.toAccountId}
                  onClick={saveMoney}
                >
                  {pending ? "در حال ذخیره…" : "ثبت جابه‌جایی"}
                </Button>
              </div>
            ) : null}

            {store.step === "convertTo" ? (
              <div className="flex flex-col gap-4">
                <button type="button" className="self-start text-sm text-foreground/55" onClick={() => store.goTo("account")}>
                  بازگشت
                </button>
                <p className="text-sm leading-7 text-foreground/70">
                  اگر این مقدار را به تومان تبدیل کردی، حساب نقد را انتخاب کن. در غیر این صورت فقط از دارایی کم می‌شود.
                </p>
                <label className="flex items-start gap-3 rounded-2xl bg-surface-muted px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    checked={store.convertToCash}
                    onChange={(event) => store.setConvertToCash(event.target.checked)}
                    className="mt-1 size-4 accent-primary"
                  />
                  <span>به تومان تبدیل شد</span>
                </label>
                {store.convertToCash ? (
                  <AccountList
                    accounts={context.accounts}
                    selectedId={store.toAccountId}
                    onSelect={store.setToAccountId}
                  />
                ) : null}
                <Button
                  type="button"
                  className="w-full"
                  disabled={pending || (store.convertToCash && !store.toAccountId)}
                  onClick={saveAsset}
                >
                  {pending ? "در حال ذخیره…" : "ثبت"}
                </Button>
              </div>
            ) : null}

            {error ? (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function CategoryGrid({
  categories,
  selectedId,
  onSelect,
}: {
  categories: QuickAddContext["categories"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = ["ESSENTIAL", "LIVING", "LIFESTYLE", "FINANCIAL"] as const;

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const items = categories.filter((category) => category.group === group);
        if (items.length === 0) {
          return null;
        }
        return (
          <section key={group}>
            <h3 className="mb-2 text-xs text-foreground/45">{CATEGORY_GROUP_LABEL[group]}</h3>
            <div className="flex flex-wrap gap-2">
              {items.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onSelect(category.id)}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm transition-colors",
                    selectedId === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-muted text-foreground",
                  )}
                >
                  <CategoryIcon name={category.icon} />
                  {category.name}
                </button>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function AccountList({
  accounts,
  selectedId,
  onSelect,
}: {
  accounts: QuickAddContext["accounts"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {accounts.map((account) => (
        <li key={account.id}>
          <button
            type="button"
            onClick={() => onSelect(account.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors",
              selectedId === account.id ? "border-primary bg-surface-muted" : "border-border bg-surface",
            )}
          >
            <span>{account.name}</span>
            <span className="numeric-display text-sm text-foreground/55">
              {formatToman(BigInt(account.balance))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function HoldingList({
  holdings,
  selectedId,
  onSelect,
}: {
  holdings: QuickAddContext["holdings"];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {holdings.map((holding) => (
        <li key={holding.id}>
          <button
            type="button"
            onClick={() => onSelect(holding.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-start transition-colors",
              selectedId === holding.id ? "border-primary bg-surface-muted" : "border-border bg-surface",
            )}
          >
            <span>{holding.name}</span>
            <span className="text-sm text-foreground/55">{holding.holdingText ?? "دارایی"}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
