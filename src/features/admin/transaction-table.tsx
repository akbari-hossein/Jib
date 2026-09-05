import Link from "next/link";
import { MoneyDisplay } from "@/components/money/money-display";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatJalaliDateTime, formatRelativeOrDate } from "@/lib/admin/format";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { AdminTransactionListItem } from "@/server/queries/admin/transactions";

export function AdminTransactionTable({
  transactions,
}: {
  transactions: AdminTransactionListItem[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">کاربر</th>
              <th className="px-4 py-3 text-start font-medium">مبلغ</th>
              <th className="px-4 py-3 text-start font-medium">نوع</th>
              <th className="px-4 py-3 text-start font-medium">دسته</th>
              <th className="px-4 py-3 text-start font-medium">حساب</th>
              <th className="px-4 py-3 text-start font-medium">تاریخ</th>
              <th className="px-4 py-3 text-start font-medium">ثبت</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr key={item.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <AdminUserIdentity
                    name={item.user.name}
                    email={item.user.email}
                    href={`/admin/users/${item.user.id}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay
                    amount={item.amount}
                    className={cn(
                      "text-sm font-semibold",
                      item.type === "INCOME" && "text-income",
                      item.type === "EXPENSE" && "text-expense",
                    )}
                  />
                </td>
                <td className="px-4 py-3">{TRANSACTION_TYPE_LABEL[item.type]}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.type === "TRANSFER"
                    ? `${item.account.name} ← ${item.toAccount?.name ?? ""}`
                    : item.account.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatRelativeOrDate(item.occurredAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatJalaliDateTime(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {transactions.map((item) => (
          <li key={item.id} className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <Link href={`/admin/users/${item.user.id}`} className="min-w-0">
                <AdminUserIdentity name={item.user.name} email={item.user.email} />
              </Link>
              <MoneyDisplay
                amount={item.amount}
                className={cn(
                  "text-sm font-semibold",
                  item.type === "INCOME" && "text-income",
                  item.type === "EXPENSE" && "text-expense",
                )}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              {TRANSACTION_TYPE_LABEL[item.type]}
              {item.category ? ` · ${item.category.name}` : ""} · {item.account.name}
            </p>
            <p className="text-xs text-muted-foreground">{formatRelativeOrDate(item.occurredAt)}</p>
            {item.merchant ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.merchant}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}
