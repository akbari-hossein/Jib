import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ContactDetailView } from "@/features/debts/contact-detail";
import { listAccounts } from "@/server/queries/accounts";
import { getContactDetail, listContacts } from "@/server/queries/debts";

export const metadata = { title: "جزئیات دنگ" };

export default async function DangContactPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const user = await requireUser();
  const { contactId } = await params;
  const [detail, contacts, accounts] = await Promise.all([
    getContactDetail(user.id, contactId),
    listContacts(user.id),
    listAccounts(user.id, { activeOnly: true }),
  ]);

  if (!detail) {
    notFound();
  }

  return (
    <ContactDetailView
      detail={detail}
      contacts={contacts}
      accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
    />
  );
}
