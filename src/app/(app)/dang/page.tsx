import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { DangComposer } from "@/features/debts/dang-composer";
import { DangContactList } from "@/features/debts/dang-contact-list";
import { DangSummary } from "@/features/debts/dang-summary";
import { listAccounts } from "@/server/queries/accounts";
import { getDangSummary, listContacts } from "@/server/queries/debts";

export const metadata = { title: "دنگ" };

export default async function DangPage() {
  const user = await requireUser();
  const [summary, contacts, accounts] = await Promise.all([
    getDangSummary(user.id),
    listContacts(user.id),
    listAccounts(user.id, { activeOnly: true }),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="دنگ"
        description="ببین از کی طلب داری و به کی بدهکاری. طلب‌ها وارد قابل‌خرج نمی‌شوند."
      />
      <DangSummary owedToMe={summary.owedToMe} iOwe={summary.iOwe} />
      <DangComposer
        contacts={contacts}
        accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
      />
      <DangContactList contacts={summary.contacts} />
    </main>
  );
}
