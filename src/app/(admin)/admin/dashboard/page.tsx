import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { MetricsOverview } from "@/features/admin/components/MetricsOverview";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { PageHeader } from "@/components/ui/page-header";
import { requireAdmin } from "@/lib/auth/admin";
import { getAdminSubscriptionMetrics } from "@/server/queries/admin/subscription-metrics";

export const metadata = { title: "اشتراک" };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const metrics = await getAdminSubscriptionMetrics();

  return (
    <main className="flex flex-col gap-8">
      <AdminBreadcrumbs />
      <PageHeader
        title="اشتراک"
        description="شمارش‌ها و مجموع درآمد از ردیف‌های واقعی دیتابیس است؛ هیچ عددی تخمینی نیست."
      />
      <MetricsOverview metrics={metrics} />
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">کاربران و پرداخت‌ها</h2>
        <UsersTable />
      </section>
    </main>
  );
}
