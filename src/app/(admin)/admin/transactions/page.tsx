import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { PaginationBar } from "@/features/admin/pagination-bar";
import { AdminTransactionTable } from "@/features/admin/transaction-table";
import {
  firstSearchParam,
  parseAmountInput,
  parseDateInput,
  parseEnum,
  parsePage,
  parseSearchQuery,
  parseTransactionType,
  SORT_DIRS,
  toSearchParams,
} from "@/lib/admin/params";
import { requireAdmin } from "@/lib/auth/admin";
import { TRANSACTION_TYPE_LABEL } from "@/lib/labels";
import { listAdminTransactions } from "@/server/queries/admin/transactions";

export const metadata = { title: "تراکنش‌ها" };

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const query = parseSearchQuery(params.q);
  const userId = firstSearchParam(params.userId).trim() || undefined;
  const accountId = firstSearchParam(params.accountId).trim() || undefined;
  const categoryName = parseSearchQuery(params.category);
  const type = parseTransactionType(params.type);
  const from = parseDateInput(params.from);
  const toInclusive = parseDateInput(params.to);
  const to = toInclusive ? new Date(toInclusive.getTime() + 24 * 60 * 60 * 1000) : undefined;
  const minAmount = parseAmountInput(params.min);
  const maxAmount = parseAmountInput(params.max);
  const dir = parseEnum(params.dir, SORT_DIRS, "desc");
  const page = parsePage(params.page);

  const result = await listAdminTransactions({
    query,
    userId,
    accountId,
    categoryName: categoryName || undefined,
    type,
    from,
    to,
    minAmount,
    maxAmount,
    dir,
    page,
  });
  const search = toSearchParams(params);

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader
        title="تراکنش‌ها"
        description="بازرسی عملیاتی. مبلغ و نوع قابل مشاهده است؛ ویرایش یا حذف از این پنل انجام نمی‌شود."
      />

      <form className="grid gap-3 rounded-3xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-4">
        <Input name="q" defaultValue={query} placeholder="کاربر، فروشنده یا حساب" className="h-11 text-sm" />
        <Input
          name="userId"
          defaultValue={userId ?? ""}
          placeholder="شناسه کاربر"
          className="h-11 text-sm"
          dir="ltr"
        />
        <Input
          name="accountId"
          defaultValue={accountId ?? ""}
          placeholder="شناسه حساب"
          className="h-11 text-sm"
          dir="ltr"
        />
        <Input
          name="category"
          defaultValue={categoryName}
          placeholder="نام دسته"
          className="h-11 text-sm"
        />
        <NativeSelect name="type" defaultValue={type ?? ""} className="h-11 text-sm">
          <option value="">همه نوع‌ها</option>
          <option value="EXPENSE">{TRANSACTION_TYPE_LABEL.EXPENSE}</option>
          <option value="INCOME">{TRANSACTION_TYPE_LABEL.INCOME}</option>
          <option value="TRANSFER">{TRANSACTION_TYPE_LABEL.TRANSFER}</option>
        </NativeSelect>
        <Input name="from" type="date" defaultValue={firstSearchParam(params.from)} className="h-11 text-sm" />
        <Input name="to" type="date" defaultValue={firstSearchParam(params.to)} className="h-11 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <Input name="min" defaultValue={firstSearchParam(params.min)} placeholder="حداقل مبلغ" className="h-11 text-sm" />
          <Input name="max" defaultValue={firstSearchParam(params.max)} placeholder="حداکثر مبلغ" className="h-11 text-sm" />
        </div>
        <NativeSelect name="dir" defaultValue={dir} className="h-11 text-sm">
          <option value="desc">جدیدترین</option>
          <option value="asc">قدیمی‌ترین</option>
        </NativeSelect>
        <Button type="submit" variant="secondary" className="h-11 md:col-span-2 xl:col-span-1">
          اعمال فیلتر
        </Button>
      </form>
      <p className="text-xs text-muted-foreground">بازه تاریخ روی ورودی تاریخ میلادی است و در سرور به UTC تبدیل می‌شود.</p>

      {result.total === 0 ? (
        <EmptyState
          title="تراکنشی پیدا نشد"
          description="فیلترها را ساده‌تر کن یا عبارت جستجو را عوض کن."
        />
      ) : (
        <>
          <AdminTransactionTable transactions={result.transactions} />
          <PaginationBar
            pathname="/admin/transactions"
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
