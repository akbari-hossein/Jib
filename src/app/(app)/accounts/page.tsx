import { requireUser } from "@/lib/auth/session";
import { listAccounts } from "@/server/queries/accounts";
import { getPlanAccess } from "@/server/queries/plan";
import { AccountForm } from "@/features/accounts/account-form";
import { AccountList } from "@/features/accounts/account-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UpgradeCallout } from "@/components/upgrade-callout";
import { limitCopy } from "@/lib/billing/plan";

export const metadata = { title: "حساب‌ها" };

export default async function AccountsPage() {
  const user = await requireUser();
  const [accounts, access] = await Promise.all([
    listAccounts(user.id),
    getPlanAccess(user.id, user.plan),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader title="حساب‌ها" description="حساب‌هایی که در قابل‌خرج باشند، عدد امروز را می‌سازند." />
      {accounts.length === 0 ? (
        <EmptyState
          title="هنوز حسابی اضافه نکردی"
          description="با اضافه کردن اولین حسابت، جیب می‌تونه وضعیت پولت رو برات محاسبه کنه."
          action={
            access.canCreateAccount ? (
              <AccountForm />
            ) : (
              <UpgradeCallout title="سقف حساب رایگان" description={limitCopy("accounts")} />
            )
          }
        />
      ) : (
        <>
          <AccountList accounts={accounts} />
          {access.canCreateAccount ? (
            <section className="rounded-3xl border border-border bg-card p-5">
              <h2 className="mb-4 text-base font-semibold">حساب جدید</h2>
              <AccountForm />
            </section>
          ) : (
            <UpgradeCallout title="سقف حساب رایگان" description={limitCopy("accounts")} />
          )}
        </>
      )}
    </main>
  );
}
