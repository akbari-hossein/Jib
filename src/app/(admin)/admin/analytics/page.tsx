import { PageHeader } from "@/components/ui/page-header";
import { AdminBarChart } from "@/features/admin/bar-chart";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { KpiCard } from "@/features/admin/kpi-card";
import { formatCount, formatPercent } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminAnalytics } from "@/server/queries/admin/analytics";

export const metadata = { title: "تحلیل محصول" };

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const analytics = await getAdminAnalytics();

  return (
    <main className="flex flex-col gap-8">
      <AdminBreadcrumbs />
      <PageHeader
        title="تحلیل محصول"
        description="نشان می‌دهد کاربران فعال‌اند یا فقط ثبت‌نام کرده‌اند."
      />

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">ثبت‌نام</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <KpiCard label="کل کاربران" value={analytics.totalUsers} />
          <KpiCard label="امروز" value={analytics.usersToday} />
          <KpiCard label="این هفته" value={analytics.usersThisWeek} />
          <KpiCard label="این ماه" value={analytics.usersThisMonth} />
        </div>
      </section>

      <AdminBarChart data={analytics.signupsByDay} label="کاربران جدید روزانه" />

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">فعال‌سازی</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <KpiCard
            label="راهنمای شروع تمام‌شده"
            value={analytics.onboardedUsers}
            hint={rateHint(analytics.onboardedUsers, analytics.totalUsers)}
          />
          <KpiCard
            label="اولین حساب"
            value={analytics.usersWithAccounts}
            hint={rateHint(analytics.usersWithAccounts, analytics.totalUsers)}
          />
          <KpiCard
            label="اولین تراکنش"
            value={analytics.usersWithTransactions}
            hint={rateHint(analytics.usersWithTransactions, analytics.totalUsers)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">تعامل</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          <KpiCard label="فعال در ۷ روز" value={analytics.activeUsers} />
          <KpiCard
            label="بازگشت بعد از ثبت‌نام"
            value={analytics.returningUsers}
            hint="آخرین فعالیت دارند و بیش از یک هفته از عضویت‌شان گذشته"
          />
          <KpiCard
            label="تراکنش به ازای کاربر فعال"
            value={Math.round(analytics.transactionsPerActiveUser)}
            hint={`${analytics.transactionsPerActiveUser} در ۳۰ روز اخیر`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">ماندگاری</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <RetentionCard
            label="ماندگاری ۱ روزه"
            cohort={analytics.retention.day1.cohort}
            retained={analytics.retention.day1.retained}
            rate={analytics.retention.day1.rate}
          />
          <RetentionCard
            label="ماندگاری ۷ روزه"
            cohort={analytics.retention.day7.cohort}
            retained={analytics.retention.day7.retained}
            rate={analytics.retention.day7.rate}
          />
          <RetentionCard
            label="ماندگاری ۳۰ روزه"
            cohort={analytics.retention.day30.cohort}
            retained={analytics.retention.day30.retained}
            rate={analytics.retention.day30.rate}
          />
        </div>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          ماندگاری یعنی کاربر بعد از ثبت‌نام، حداقل به همان تعداد روز دوباره فعال شده باشد. اگر
          تعداد کاربران این بازه هنوز کم است، درصد نمایش داده نمی‌شود.
        </p>
      </section>
    </main>
  );
}

function rateHint(part: number, total: number) {
  if (total <= 0) {
    return "هنوز کاربری نیست";
  }
  return `${formatPercent((part / total) * 100)} از کاربران`;
}

function RetentionCard({
  label,
  cohort,
  retained,
  rate,
}: {
  label: string;
  cohort: number;
  retained: number;
  rate: number | null;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5 shadow-xs">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="numeric-display mt-2 text-3xl font-semibold tracking-tight">
        {rate == null ? "—" : formatPercent(rate)}
      </p>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        {formatCount(retained)} از {formatCount(cohort)} کاربر این بازه
      </p>
    </article>
  );
}
