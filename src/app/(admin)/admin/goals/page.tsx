import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminGoalTable } from "@/features/admin/goal-table";
import { PaginationBar } from "@/features/admin/pagination-bar";
import {
  parseEnum,
  parsePage,
  parseSearchQuery,
  SORT_DIRS,
  toSearchParams,
} from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminGoals } from "@/server/queries/admin/goals";

export const metadata = { title: "اهداف" };

const GOAL_STATUS = ["all", "active", "archived"] as const;

export default async function AdminGoalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const status = parseEnum(params.status, GOAL_STATUS, "all");
  const dir = parseEnum(params.dir, SORT_DIRS, "desc");
  const page = parsePage(params.page);
  const result = await listAdminGoals({ query, status, dir, page });
  const search = toSearchParams(params);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader title="اهداف" description="نمای کلی اهداف پس‌انداز کاربران." />

      <form className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_10rem_10rem_auto]">
        <Input name="q" defaultValue={query} placeholder="نام هدف یا کاربر" className="h-11 text-sm" />
        <NativeSelect name="status" defaultValue={status} className="h-11 text-sm">
          <option value="all">همه</option>
          <option value="active">فعال</option>
          <option value="archived">بایگانی</option>
        </NativeSelect>
        <NativeSelect name="dir" defaultValue={dir} className="h-11 text-sm">
          <option value="desc">جدیدترین</option>
          <option value="asc">قدیمی‌ترین</option>
        </NativeSelect>
        <Button type="submit" variant="secondary" className="h-11">
          اعمال
        </Button>
      </form>

      {result.total === 0 ? (
        <EmptyState title="هدفی پیدا نشد" description="فیلتر یا جستجو را تغییر بده." />
      ) : (
        <>
          <AdminGoalTable goals={result.goals} />
          <PaginationBar
            pathname="/admin/goals"
            search={search}
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
          />
        </>
      )}
    </main>
  );
}
