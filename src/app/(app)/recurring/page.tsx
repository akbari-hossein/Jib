import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UpgradeCallout } from "@/components/upgrade-callout";
import { RecurringForm } from "@/features/recurring/recurring-form";
import { RecurringList } from "@/features/recurring/recurring-list";
import { featureCopy } from "@/lib/billing/plan";
import { listAccounts } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { getPlanAccess } from "@/server/queries/plan";
import { listRecurring } from "@/server/queries/recurring";

export const metadata = { title: "تکراری‌ها" };

export default async function RecurringPage() {
  const user = await requireUser();
  const [items, accounts, categories, access] = await Promise.all([
    listRecurring(user.id),
    listAccounts(user.id, { activeOnly: true }),
    listCategories(user.id),
    getPlanAccess(user.id, user.plan),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="تکراری‌ها"
        description="اجاره، قسط یا حقوق را اینجا بگذار. موعد بعدی از قابل‌خرج کم می‌شود تا وقتی ثبتش کنی."
      />

      {items.length === 0 ? (
        <EmptyState
          title="هنوز مورد تکراری نداری"
          description="اجاره یا اشتراک ماهانه را اضافه کن تا قبل از موعد در عدد امروز دیده شود."
        />
      ) : (
        <RecurringList items={items} />
      )}

      {access.canUseRecurring ? (
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">مورد جدید</h2>
          <RecurringForm
            accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
            categories={categories.map((category) => ({
              id: category.id,
              name: category.name,
              kind: category.kind,
            }))}
          />
        </section>
      ) : (
        <UpgradeCallout title="نسخه حرفه‌ای" description={featureCopy("recurring")} />
      )}
    </main>
  );
}
