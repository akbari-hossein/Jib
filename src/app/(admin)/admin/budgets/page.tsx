import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { AdminBudgetTable } from "@/features/admin/budget-table";
import { PaginationBar } from "@/features/admin/pagination-bar";
import {
  parseEnum,
  parsePage,
  parseSearchQuery,
  SORT_DIRS,
  toSearchParams,
} from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminBudgets } from "@/server/queries/admin/budgets";

export const metadata = { title: "بودجه‌ها" };

export default async function AdminBudgetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const dir = parseEnum(params.dir, SORT_DIRS, "desc");
  const page = parsePage(params.page);
  const result = await listAdminBudgets({ query, dir, page });
  const search = toSearchParams(params);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader title="بودجه‌ها" description="مصرف ماهانه نسبت به سقفی که کاربر تعیین کرده." />

      <form className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_10rem_auto]">
        <Input name="q" defaultValue={query} placeholder="ایمیل یا نام کاربر" className="h-11 text-sm" />
        <NativeSelect name="dir" defaultValue={dir} className="h-11 text-sm">
          <option value="desc">جدیدترین ماه</option>
          <option value="asc">قدیمی‌ترین ماه</option>
        </NativeSelect>
        <Button type="submit" variant="secondary" className="h-11">
          اعمال
        </Button>
      </form>

      {result.total === 0 ? (
        <EmptyState title="بودجه‌ای پیدا نشد" description="وقتی کاربری بودجه بسازد، اینجا دیده می‌شود." />
      ) : (
        <>
          <AdminBudgetTable budgets={result.budgets} />
          <PaginationBar
            pathname="/admin/budgets"
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
