import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoneyDisplay } from "@/components/money/money-display";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminUserIdentity } from "@/features/admin/user-identity";
import { formatCount, formatJalaliDateTime, formatRelativeOrDate } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/admin";
import { ACCOUNT_TYPE_LABEL, TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { getAdminAccountDetail } from "@/server/queries/admin/accounts";
import { cn } from "@/lib/utils";

export const metadata = { title: "جزئیات حساب" };

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const account = await getAdminAccountDetail(id);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs current={account.name} />
      <PageHeader
        title={account.name}
        description={ACCOUNT_TYPE_LABEL[account.type]}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/transactions?accountId=${account.id}`}>تراکنش‌ها</Link>
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">مانده</p>
          <p className="mt-2 text-2xl font-semibold">
            <MoneyDisplay amount={account.balance} />
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">وضعیت</p>
          <div className="mt-2">
            <Badge tone={account.isActive ? "income" : "muted"}>
              {account.isActive ? "فعال" : "بایگانی"}
            </Badge>
          </div>
        </article>
        <article className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">قابل‌خرج</p>
          <p className="mt-2 text-sm font-medium">{account.includeInAvailable ? "بله" : "نه"}</p>
        </article>
        <article className="rounded-3xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">ایجاد</p>
          <p className="mt-2 text-sm font-medium">{formatJalaliDateTime(account.createdAt)}</p>
        </article>
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">صاحب حساب</h2>
        </CardHeader>
        <CardContent>
          <AdminUserIdentity
            name={account.user.name}
            email={account.user.email}
            href={`/admin/users/${account.user.id}`}
          />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        تراکنش‌ها: {formatCount(account._count.outgoingTransactions)} · ورودی جابه‌جایی:{" "}
        {formatCount(account._count.incomingTransfers)} · اهداف: {formatCount(account._count.goals)} · تکراری:{" "}
        {formatCount(account._count.recurring)}
      </p>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">آخرین تراکنش‌ها</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {account.outgoingTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">تراکنشی روی این حساب نیست.</p>
          ) : (
            account.outgoingTransactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                <div>
                  <p className="text-sm">{item.category?.name ?? TRANSACTION_TYPE_LABEL[item.type]}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeOrDate(item.occurredAt)}</p>
                </div>
                <MoneyDisplay
                  amount={item.amount}
                  className={cn(
                    "text-sm font-semibold",
                    item.type === "INCOME" && "text-income",
                    item.type === "EXPENSE" && "text-expense",
                  )}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
