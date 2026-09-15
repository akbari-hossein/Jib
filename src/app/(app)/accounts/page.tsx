import { requireUser } from "@/lib/auth/session";
import { listAccounts, toAccountListItem } from "@/server/queries/accounts";
import { AccountForm } from "@/features/accounts/account-form";
import { AccountList } from "@/features/accounts/account-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ReadOnlyOverlay } from "@/features/subscription/components/ReadOnlyOverlay";

export const metadata = { title: "حساب‌ها" };

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);
  const items = accounts.map(toAccountListItem);

  return (
    <main data-tour="accounts-page" className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="حساب‌ها"
        description="حساب‌هایی که در قابل‌خرج باشند، عدد امروز را می‌سازند."
        dataTour="accounts-heading"
      />
      {accounts.length === 0 ? (
        <EmptyState
          title="هنوز حسابی اضافه نکردی"
          description="اولین حساب را اضافه کن تا عدد قابل‌خرج ساخته شود."
          action={
            <div data-tour="add-account">
              <ReadOnlyOverlay>
                <AccountForm />
              </ReadOnlyOverlay>
            </div>
          }
        />
      ) : (
        <>
          <AccountList accounts={items} />
          <section data-tour="add-account" className="rounded-3xl border border-border bg-card p-5">
            <h2 className="mb-4 text-base font-semibold">حساب جدید</h2>
            <ReadOnlyOverlay>
              <AccountForm />
            </ReadOnlyOverlay>
          </section>
        </>
      )}
    </main>
  );
}
