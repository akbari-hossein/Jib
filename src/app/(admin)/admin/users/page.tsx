import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { PaginationBar } from "@/features/admin/pagination-bar";
import { AdminUserTable } from "@/features/admin/user-table";
import { USER_FILTER_LABEL } from "@/lib/admin/labels";
import {
  parseEnum,
  parsePage,
  parseSearchQuery,
  SORT_DIRS,
  toSearchParams,
  USER_FILTERS,
  USER_SORTS,
} from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminUsers } from "@/server/queries/admin/users";

export const metadata = { title: "کاربران" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const filter = parseEnum(params.filter, USER_FILTERS, "all");
  const sort = parseEnum(params.sort, USER_SORTS, "createdAt");
  const dir = parseEnum(params.dir, SORT_DIRS, "desc");
  const page = parsePage(params.page);
  const result = await listAdminUsers({ query, filter, sort, dir, page });
  const search = toSearchParams(params);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader title="کاربران" description="جستجو و فیلتر کاربران، بدون جزئیات مالی در لیست." />

      <form className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_12rem_auto]">
        <Input
          name="q"
          defaultValue={query}
          placeholder="ایمیل، نام یا شناسه"
          className="h-11 text-sm"
        />
        <NativeSelect name="filter" defaultValue={filter} className="h-11 text-sm">
          {USER_FILTERS.map((item) => (
            <option key={item} value={item}>
              {USER_FILTER_LABEL[item]}
            </option>
          ))}
        </NativeSelect>
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <Button type="submit" variant="secondary" className="h-11">
          اعمال
        </Button>
      </form>

      {result.total === 0 ? (
        <EmptyState
          title={query || filter !== "all" ? "نتیجه‌ای پیدا نشد" : "هنوز کاربری نیست"}
          description={
            query || filter !== "all"
              ? "فیلتر یا جستجو را تغییر بده."
              : "وقتی کسی در جیب ثبت‌نام کند، اینجا دیده می‌شود."
          }
        />
      ) : (
        <>
          <AdminUserTable users={result.users} sort={sort} dir={dir} search={search} />
          <PaginationBar
            pathname="/admin/users"
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
