import { PageHeader } from "@/components/ui/page-header";
import { AdminBreadcrumbs } from "@/features/admin/admin-breadcrumbs";
import { requireAdmin } from "@/lib/auth/admin";
import { REFERENCE_ASSET_OPTION_LABEL } from "@/lib/finance/purchasing-power";
import { getRateHealth } from "@/lib/finance/referenceRates";
import { formatJalaliAbsolute, jalaliFromInstant } from "@/lib/dates/tehran";

export const metadata = { title: "نرخ‌ها" };

export default async function AdminRatesPage() {
  await requireAdmin();
  const health = await getRateHealth();

  return (
    <main className="flex flex-col gap-6">
      <AdminBreadcrumbs />
      <PageHeader
        title="سلامت نرخ‌ها"
        description="آخرین دریافت موفق و آخرین خطا برای هر دارایی. این صفحه برای توست، نه برای کاربر."
      />

      <section className="rounded-3xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          فراهم‌کننده: {health.provider ?? "تنظیم نشده"}
        </p>
      </section>

      {health.rows.length === 0 ? (
        <p className="text-sm leading-7 text-muted-foreground">هنوز نرخ یا رویداد دریافتی ثبت نشده.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {health.rows.map((row) => (
            <li
              key={row.assetType ?? "all"}
              className="rounded-3xl border border-border bg-card px-5 py-4 text-sm"
            >
              <p className="font-medium">
                {row.assetType ? REFERENCE_ASSET_OPTION_LABEL[row.assetType] : "کل فراهم‌کننده"}
              </p>
              <dl className="mt-3 grid gap-2 text-muted-foreground">
                <div>
                  آخرین نرخ: {row.lastRateToToman ?? "—"}
                  {row.lastRateAt ? ` · ${formatJalaliAbsolute(jalaliFromInstant(row.lastRateAt))}` : ""}
                  {row.stale ? " · کهنه" : ""}
                </div>
                <div>
                  آخرین دریافت موفق:{" "}
                  {row.lastSuccessAt ? formatJalaliAbsolute(jalaliFromInstant(row.lastSuccessAt)) : "—"}
                </div>
                <div>
                  آخرین خطا: {row.lastError ?? "—"}
                  {row.lastErrorAt ? ` · ${formatJalaliAbsolute(jalaliFromInstant(row.lastErrorAt))}` : ""}
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
