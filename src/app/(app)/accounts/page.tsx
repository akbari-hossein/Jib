import { requireUser } from "@/lib/auth/session";
import { listAccounts } from "@/server/queries/accounts";
import { AccountForm } from "@/features/accounts/account-form";
import { AccountList } from "@/features/accounts/account-list";
import { EmptyState } from "@/components/empty-state";

export default async function AccountsPage() {
  const user = await requireUser();
  const accounts = await listAccounts(user.id);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">حساب‌ها</h1>
      {accounts.length === 0 ? (
        <EmptyState
          title="اولین حسابت را بساز"
          description="موجودی نقد، کارت یا بانک را وارد کن تا جیب بداند چقدر پول داری."
          action={<AccountForm />}
        />
      ) : (
        <>
          <AccountList accounts={accounts} />
          <section className="rounded-3xl border border-border bg-surface p-5">
            <h2 className="mb-4 text-base font-semibold">حساب جدید</h2>
            <AccountForm />
          </section>
        </>
      )}
    </main>
  );
}
