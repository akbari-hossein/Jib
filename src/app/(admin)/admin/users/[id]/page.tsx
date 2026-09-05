import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { MoneyDisplay } from "@/components/money/money-display";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminUserActions } from "@/features/admin/user-actions";
import { formatCount, formatJalaliAbsolute, formatJalaliDateTime, formatRelativeOrDate } from "@/lib/admin/format";
import { USER_ROLE_LABEL, USER_STATUS_LABEL } from "@/lib/admin/labels";
import { requireAdmin } from "@/lib/auth/admin";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { getAdminUserDetail } from "@/server/queries/admin/users";
import { cn } from "@/lib/utils";

export const metadata = { title: "جزئیات کاربر" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const user = await getAdminUserDetail(id);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs current={user.name?.trim() || user.email} />
      <PageHeader
        title={user.name?.trim() || "بدون نام"}
        description={user.email}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/transactions?userId=${user.id}`}>تراکنش‌ها</Link>
          </Button>
        }
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="شناسه" value={user.id} dir="ltr" />
        <InfoCard label="نقش" value={USER_ROLE_LABEL[user.role]} />
        <InfoCard label="وضعیت" value={USER_STATUS_LABEL[user.status]} />
        <InfoCard
          label="روز درآمد"
          value={user.incomeDayOfMonth != null ? formatCount(user.incomeDayOfMonth) : "—"}
        />
        <InfoCard label="عضویت" value={formatJalaliAbsolute(user.createdAt)} />
        <InfoCard
          label="آخرین فعالیت"
          value={user.lastActiveAt ? formatJalaliDateTime(user.lastActiveAt) : "—"}
        />
        <InfoCard
          label="راهنمای شروع"
          value={user.onboardingCompletedAt ? formatRelativeOrDate(user.onboardingCompletedAt) : "ناتمام"}
        />
        <InfoCard
          label="ورود"
          value={[user.hasPassword ? "ایمیل" : null, user.signedInWithGoogle ? "گوگل" : null]
            .filter(Boolean)
            .join(" · ") || "نامشخص"}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="حساب‌ها" value={user.counts.accounts} />
        <StatCard label="تراکنش‌ها" value={user.counts.transactions} />
        <StatCard label="بودجه‌ها" value={user.counts.budgets} />
        <StatCard label="اهداف فعال" value={user.counts.goals} />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MoneyCard label="جمع مانده حساب‌ها" amount={user.totalBalance} />
        <MoneyCard label="درآمد این ماه" amount={user.monthlyIncome} tone="income" />
        <MoneyCard label="هزینه این ماه" amount={user.monthlyExpense} tone="expense" />
        <MoneyCard label="پس‌انداز این ماه" amount={user.monthlySaved} tone="savings" />
      </section>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">حساب‌ها</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {user.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">هنوز حسابی نساخته.</p>
          ) : (
            user.accounts.map((account) => (
              <Link
                key={account.id}
                href={`/admin/accounts/${account.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {account.isActive ? "فعال" : "بایگانی"} · {formatRelativeOrDate(account.createdAt)}
                  </p>
                </div>
                <MoneyDisplay amount={account.balance} className="text-sm font-semibold" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">اهداف فعال</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {user.goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">هدف فعالی ندارد.</p>
          ) : (
            user.goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                <p className="font-medium">{goal.name}</p>
                <p className="text-xs text-muted-foreground">
                  <MoneyDisplay amount={goal.currentAmount} className="text-xs" /> از{" "}
                  <MoneyDisplay amount={goal.targetAmount} className="text-xs" />
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold">آخرین تراکنش‌ها</h2>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {user.recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">تراکنشی ثبت نشده.</p>
          ) : (
            user.recentTransactions.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm">
                    {item.category?.name ?? TRANSACTION_TYPE_LABEL[item.type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.account.name} · {formatRelativeOrDate(item.occurredAt)}
                  </p>
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

      <p className="text-xs text-muted-foreground">
        نشست‌های فعال: {formatCount(user.counts.activeSessions)} · قوانین تکرارشونده:{" "}
        {formatCount(user.counts.recurring)}
      </p>

      <AdminUserActions
        userId={user.id}
        email={user.email}
        role={user.role}
        status={user.status}
        onboardingCompleted={user.onboardingCompletedAt != null}
        isSelf={admin.id === user.id}
      />
    </main>
  );
}

function InfoCard({ label, value, dir }: { label: string; value: string; dir?: "ltr" }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 break-all text-sm font-medium" dir={dir}>
        {value}
      </p>
    </article>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-2xl font-semibold">{formatCount(value)}</p>
    </article>
  );
}

function MoneyCard({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: bigint;
  tone?: "income" | "expense" | "savings";
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-lg font-semibold",
          tone === "income" && "text-income",
          tone === "expense" && "text-expense",
          tone === "savings" && "text-savings",
        )}
      >
        <MoneyDisplay amount={amount} />
      </p>
    </article>
  );
}
