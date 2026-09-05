import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAuditTable } from "@/features/admin/audit-table";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { PaginationBar } from "@/features/admin/pagination-bar";
import { ADMIN_AUDIT_LABEL } from "@/lib/admin/labels";
import {
  parseOptionalEnum,
  parsePage,
  parseSearchQuery,
  toSearchParams,
} from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { listAdminAuditLogs } from "@/server/queries/admin/audit";
import type { AdminAuditAction } from "@prisma/client";

export const metadata = { title: "گزارش اقدامات" };

const ACTIONS = [
  "USER_DISABLED",
  "USER_REACTIVATED",
  "USER_ROLE_CHANGED",
  "USER_ONBOARDING_RESET",
  "USER_DELETED",
] as const satisfies readonly AdminAuditAction[];

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const action = parseOptionalEnum(params.action, ACTIONS);
  const page = parsePage(params.page);
  const result = await listAdminAuditLogs({ query, action, page });
  const search = toSearchParams(params);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader
        title="گزارش اقدامات"
        description="اقدامات حساس مدیران ثبت می‌شود. رمز عبور و توکن هرگز اینجا ذخیره نمی‌شود."
      />

      <form className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-[1fr_14rem_auto]">
        <Input name="q" defaultValue={query} placeholder="ایمیل مدیر یا شناسه هدف" className="h-11 text-sm" />
        <NativeSelect name="action" defaultValue={action ?? ""} className="h-11 text-sm">
          <option value="">همه اقدام‌ها</option>
          {ACTIONS.map((item) => (
            <option key={item} value={item}>
              {ADMIN_AUDIT_LABEL[item]}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="secondary" className="h-11">
          اعمال
        </Button>
      </form>

      {result.total === 0 ? (
        <EmptyState
          title="هنوز اقدامی ثبت نشده"
          description="وقتی وضعیتی عوض شود یا کاربری حذف شود، اینجا می‌آید."
        />
      ) : (
        <>
          <AdminAuditTable logs={result.logs} />
          <PaginationBar
            pathname="/admin/audit"
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
