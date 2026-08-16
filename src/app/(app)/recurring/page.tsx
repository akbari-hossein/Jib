import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";
import { UpgradeCallout } from "@/components/upgrade-callout";
import { RecurringForm } from "@/features/recurring/recurring-form";
import { RecurringList } from "@/features/recurring/recurring-list";
import { featureCopy } from "@/lib/billing/plan";
import { listAccounts } from "@/server/queries/accounts";
import { listCategories } from "@/server/queries/categories";
import { getPlanAccess } from "@/server/queries/plan";
import { listRecurring } from "@/server/queries/recurring";

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">تکراری‌ها</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          اجاره، قسط یا حقوق را اینجا بگذار. موعد بعدی از قابل‌خرج کم می‌شود تا وقتی ثبتش کنی.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title="هنوز مورد تکراری نداری"
          description="اجاره یا اشتراک ماهانه را اضافه کن تا در عدد امروز دیده شود."
        />
      ) : (
        <RecurringList items={items} />
      )}

      {access.canUseRecurring ? (
        <section className="rounded-3xl border border-border bg-surface p-5">
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
