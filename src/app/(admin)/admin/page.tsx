import { AdminBarChart } from "@/features/admin/bar-chart";
import { KpiCard } from "@/features/admin/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatCount } from "@/lib/admin/format";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminOverview } from "@/server/queries/admin/overview";

export const metadata = { title: "نمای کلی" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const overview = await getAdminOverview();

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        title="نمای کلی"
        description="وضعیت واقعی محصول از روی داده‌های جیب. هیچ عددی ساختگی نیست."
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="کاربران" value={overview.totalUsers} trend={overview.totalUsersTrend} period="month" />
        <KpiCard label="کاربران جدید امروز" value={overview.usersToday} trend={overview.usersTodayTrend} period="day" />
        <KpiCard label="کاربران جدید این هفته" value={overview.usersThisWeek} trend={overview.usersWeekTrend} period="week" />
        <KpiCard label="کاربران جدید این ماه" value={overview.usersThisMonth} trend={overview.usersMonthTrend} period="month" />
        <KpiCard
          label="کاربران فعال"
          value={overview.activeUsers}
          trend={overview.activeUsersTrend}
          period="week"
        />
        <KpiCard
          label="راهنمای شروع تمام‌شده"
          value={overview.onboardedUsers}
          hint={
            overview.totalUsers > 0
              ? `${formatCount(Math.round((overview.onboardedUsers / overview.totalUsers) * 100))}٪ از کاربران`
              : "هنوز کاربری نیست"
          }
        />
        <KpiCard label="حداقل یک حساب" value={overview.usersWithAccounts} />
        <KpiCard label="حداقل یک تراکنش" value={overview.usersWithTransactions} />
        <KpiCard label="تراکنش‌ها" value={overview.totalTransactions} />
        <KpiCard label="حساب‌ها" value={overview.totalAccounts} />
        <KpiCard label="اهداف" value={overview.totalGoals} />
        <KpiCard label="بودجه‌ها" value={overview.totalBudgets} />
        <KpiCard label="کاربران غیرفعال" value={overview.disabledUsers} />
      </section>

      <AdminBarChart data={overview.signupsByDay} label="کاربران جدید در ۳۰ روز اخیر" />
    </main>
  );
}
