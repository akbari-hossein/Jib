import { deleteTransaction } from "@/server/actions/transactions";
import { CategoryIcon } from "@/components/category-icon";
import { MoneyDisplay } from "@/components/money/money-display";
import { Button } from "@/components/ui/button";
import { formatJalaliDay, getTehranJalaliDate, jalaliFromInstant } from "@/lib/dates/tehran";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Account, Category, Transaction } from "@prisma/client";

type Row = Transaction & {
  category: Category | null;
  account: Account;
  toAccount: Account | null;
};

export function TransactionList({ transactions }: { transactions: Row[] }) {
  const today = getTehranJalaliDate();
  const groups = new Map<string, { label: string; items: Row[] }>();

  for (const item of transactions) {
    const day = jalaliFromInstant(item.occurredAt);
    const key = `${day.year}-${day.month}-${day.day}`;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { label: formatJalaliDay(day, today), items: [item] });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.values()].map((group) => (
        <section key={group.label} className="flex flex-col gap-2">
          <h2 className="text-xs text-foreground/45">{group.label}</h2>
          <ul className="flex flex-col gap-2">
            {group.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-surface-muted">
                    <CategoryIcon name={item.category?.icon ?? "repeat"} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {item.type === "TRANSFER"
                        ? `از ${item.account.name} به ${item.toAccount?.name ?? ""}`
                        : item.category?.name ?? TRANSACTION_TYPE_LABEL[item.type]}
                    </p>
                    <p className="truncate text-xs text-foreground/45">
                      {item.merchant ? `${item.merchant} · ` : ""}
                      {item.type === "TRANSFER" ? "جابه‌جایی" : item.account.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <MoneyDisplay
                    amount={item.amount}
                    withUnit={false}
                    className={cn(
                      "text-sm font-semibold",
                      item.type === "INCOME" && "text-income",
                      item.type === "EXPENSE" && "text-expense",
                    )}
                  />
                  <form action={deleteTransaction}>
                    <input type="hidden" name="id" value={item.id} />
                    <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-foreground/40">
                      حذف
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
