"use client";

import { useState } from "react";
import { AccountEditor } from "@/features/accounts/account-editor";
import { AccountGlyph } from "@/features/accounts/account-icon";
import { MoneyDisplay } from "@/components/money/money-display";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";
import type { AccountListItem } from "@/server/queries/accounts";

export function AccountList({ accounts }: { accounts: AccountListItem[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = accounts.find((account) => account.id === editingId) ?? null;

  return (
    <>
      <ul className="flex flex-col gap-3">
        {accounts.map((account) => (
          <li key={account.id}>
            <button
              type="button"
              onClick={() => setEditingId(account.id)}
              className="flex w-full items-center gap-3 rounded-3xl border border-border bg-card px-4 py-4 text-start transition-colors hover:bg-surface-muted/60"
            >
              <AccountGlyph icon={account.icon} type={account.type} color={account.color} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{account.name}</p>
                <p className="mt-1 text-xs text-foreground/45">
                  {ACCOUNT_TYPE_LABEL[account.type]}
                  {account.isActive ? "" : " · بایگانی"}
                  {account.includeInAvailable ? "" : " · خارج از قابل‌خرج"}
                </p>
              </div>
              <MoneyDisplay amount={account.balance} className="text-sm font-semibold" />
            </button>
          </li>
        ))}
      </ul>
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
