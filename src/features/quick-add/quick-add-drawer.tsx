"use client";

import { useMemo, useState, useTransition } from "react";
import { Drawer } from "vaul";
import { toast } from "sonner";
import { AmountKeypad } from "@/features/quick-add/amount-keypad";
import { useQuickAddStore } from "@/features/quick-add/store";
import { CategoryIcon } from "@/components/category-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatToman, toPersianDigits } from "@/lib/currency/format";
import { matchTransactionRule } from "@/lib/finance/rules";
import { CATEGORY_GROUP_LABEL } from "@/lib/labels";
import { createQuickTransaction } from "@/server/actions/transactions";
import type { QuickAddContext } from "@/server/queries/quick-add";
import { cn } from "@/lib/utils";

const TYPES = [
  { id: "EXPENSE", label: "هزینه" },
  { id: "INCOME", label: "درآمد" },
  { id: "TRANSFER", label: "جابه‌جایی" },
] as const;

export function QuickAddDrawer({ context }: { context: QuickAddContext }) {
  const store = useQuickAddStore();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const amount = store.digits ? BigInt(store.digits) : 0n;
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
    if (amount <= 0n) {
      return;
    }
    if (store.type === "TRANSFER") {
      store.goTo("account");
      return;
    }
    store.goTo("category");
  }

  function save() {
    if (!selectedAccountId) {
      setError("حساب را انتخاب کن.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createQuickTransaction({
        type: store.type,
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
                <div className="flex gap-2">
                  {TYPES.map((item) => (
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
                  {amount > 0n ? formatToman(amount) : toPersianDigits("0 تومان")}
                </p>
                <AmountKeypad
                  onDigit={store.appendDigit}
                  onThousand={store.appendThousand}
                  onBackspace={store.backspace}
                />
                <Button type="button" className="w-full" disabled={amount <= 0n} onClick={goNextFromAmount}>
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

            {store.step === "account" ? (
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  className="self-start text-sm text-foreground/55"
                  onClick={() => store.goTo(store.type === "TRANSFER" ? "amount" : "category")}
                >
                  بازگشت
                </button>
                <p className="numeric-display text-lg font-semibold">{formatToman(amount)}</p>
                <p className="text-sm text-foreground/55">
                  {store.type === "TRANSFER" ? "از کدام حساب؟" : "از کدام حساب؟"}
                </p>
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
                  <Button type="button" className="w-full" disabled={pending || !selectedAccountId} onClick={save}>
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
                  onClick={save}
                >
                  {pending ? "در حال ذخیره…" : "ثبت جابه‌جایی"}
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
              {formatToman(BigInt(account.balance), { withUnit: false })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
