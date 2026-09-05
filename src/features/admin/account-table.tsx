import Link from "next/link";
import { MoneyDisplay } from "@/components/money/money-display";
import { Badge } from "@/components/ui/badge";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatRelativeOrDate } from "@/lib/admin/format";
import { ACCOUNT_TYPE_LABEL } from "@/lib/labels";

export function AdminAccountTable({
  accounts,
}: {
  accounts: Array<{
    id: string;
    name: string;
    type: keyof typeof ACCOUNT_TYPE_LABEL;
    balance: bigint;
    isActive: boolean;
    createdAt: Date;
    user: { id: string; name: string | null; email: string };
    _count: { outgoingTransactions: number };
  }>;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-3xl border border-border bg-card md:block">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start font-medium">کاربر</th>
              <th className="px-4 py-3 text-start font-medium">حساب</th>
              <th className="px-4 py-3 text-start font-medium">نوع</th>
              <th className="px-4 py-3 text-start font-medium">مانده</th>
              <th className="px-4 py-3 text-start font-medium">ایجاد</th>
              <th className="px-4 py-3 text-start font-medium">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3">
                  <AdminUserIdentity
                    name={account.user.name}
                    email={account.user.email}
                    href={`/admin/users/${account.user.id}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/accounts/${account.id}`} className="font-medium hover:text-primary">
                    {account.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ACCOUNT_TYPE_LABEL[account.type]}</td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={account.balance} className="text-sm" />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatRelativeOrDate(account.createdAt)}</td>
                <td className="px-4 py-3">
                  <Badge tone={account.isActive ? "income" : "muted"}>
                    {account.isActive ? "فعال" : "بایگانی"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden">
        {accounts.map((account) => (
          <li key={account.id}>
            <Link href={`/admin/accounts/${account.id}`} className="block rounded-3xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABEL[account.type]}</p>
                </div>
                <MoneyDisplay amount={account.balance} className="text-sm font-semibold" />
              </div>
              <div className="mt-3">
                <AdminUserIdentity name={account.user.name} email={account.user.email} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
