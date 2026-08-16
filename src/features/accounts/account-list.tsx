import { archiveAccount } from "@/server/actions/accounts";
import { MoneyDisplay } from "@/components/money/money-display";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";
import type { Account } from "@prisma/client";

export function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {accounts.map((account) => (
        <li
          key={account.id}
          className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-surface px-4 py-4"
        >
          <div>
            <p className="font-medium">{account.name}</p>
            <p className="mt-1 text-xs text-foreground/45">
              {ACCOUNT_TYPE_LABEL[account.type]}
              {account.isActive ? "" : " · بایگانی"}
              {account.includeInAvailable ? "" : " · خارج از قابل‌خرج"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <MoneyDisplay amount={account.balance} className="text-sm font-semibold" />
            {account.isActive ? (
              <form action={archiveAccount}>
                <input type="hidden" name="id" value={account.id} />
                <Button type="submit" variant="ghost" size="sm">
                  بایگانی
                </Button>
              </form>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
