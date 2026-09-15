import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { MetricsOverview } from "@/features/admin/components/MetricsOverview";
import { UsersTable } from "@/features/admin/components/UsersTable";
import { PageHeader } from "@/components/ui/page-header";
import { firstSearchParam, toSearchParams } from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { parseAdminUsersQuery } from "@/lib/subscription/admin-users";
import { listAdminSubscribers } from "@/server/queries/admin/subscribers";
import { getAdminSubscriptionMetrics } from "@/server/queries/admin/subscription-metrics";

export const metadata = { title: "اشتراک" };

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseAdminUsersQuery({
    status: firstSearchParam(params.status),
    search: firstSearchParam(params.search),
    page: firstSearchParam(params.page),
    pageSize: firstSearchParam(params.pageSize),
  });
  const [metrics, subscribers] = await Promise.all([
    getAdminSubscriptionMetrics(),
    listAdminSubscribers(query),
  ]);

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
        <UsersTable
          users={subscribers.users}
          total={subscribers.total}
          page={subscribers.page}
          pageSize={subscribers.pageSize}
          status={query.status}
          search={query.search}
          searchParams={toSearchParams(params)}
        />
      </section>
    </main>
  );
}
