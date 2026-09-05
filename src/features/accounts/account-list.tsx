"use client";

import { useState } from "react";
import { AccountEditor } from "@/features/accounts/account-editor";
import { AccountGlyph } from "@/features/accounts/account-icon";
import { HoldingExplain } from "@/components/finance/holding-explain";
import { MoneyDisplay } from "@/components/money/money-display";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";
import { toPersianDigits } from "@/lib/currency/format";
import type { AccountListItem } from "@/server/queries/accounts";

export function AccountList({ accounts }: { accounts: AccountListItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = accounts.find((account) => account.id === editingId) ?? null;
  const holdings = accounts.filter((account) => account.type === "ASSET_HOLDING");
  const rest = accounts.filter((account) => account.type !== "ASSET_HOLDING");

  return (
    <>
      {holdings.length > 0 ? (
        <section className="mb-6">
          <h2 className="mb-3 text-sm text-muted-foreground">دارایی‌ها</h2>
          <AccountRows accounts={holdings} onEdit={setEditingId} />
        </section>
      ) : null}
      {rest.length > 0 ? <AccountRows accounts={rest} onEdit={setEditingId} /> : null}
      <AccountEditor
        account={editing}
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
          }
        }}
      />
    </>
  );
}

function AccountRows({
  accounts,
  onEdit,
}: {
  accounts: AccountListItem[];
  onEdit: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {accounts.map((account) => (
        <li key={account.id}>
          <button
            type="button"
            onClick={() => onEdit(account.id)}
            className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card px-4 py-4 text-start transition-colors hover:bg-surface-muted/60"
          >
            <AccountGlyph icon={account.icon} type={account.type} color={account.color} />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{account.name}</p>
              <p className="mt-1 text-xs text-foreground/45">
                {account.holdingText ?? ACCOUNT_TYPE_LABEL[account.type]}
                {account.isActive ? "" : " · بایگانی"}
                {account.includeInAvailable ? "" : " · خارج از قابل‌خرج"}
              </p>
              {account.staleLabel ? (
                <p className="mt-1 text-[11px] text-muted-foreground">{account.staleLabel}</p>
              ) : null}
              {account.dayMove && account.dayMove.direction !== "flat" ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {account.dayMove.direction === "up" ? "نسبت به دیروز کمی بالاتر" : "نسبت به دیروز کمی پایین‌تر"}
                  {account.dayMove.pct > 0 ? ` · ${toPersianDigits(account.dayMove.pct)}٪` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              {account.valueUnavailable ? (
                <span className="text-xs text-muted-foreground">نرخ موجود نیست</span>
              ) : (
                <MoneyDisplay amount={account.balance} className="text-sm font-semibold" />
              )}
              {account.holdingDetail ? <HoldingExplain detail={account.holdingDetail} /> : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
