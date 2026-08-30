import { requireUser } from "@/lib/auth/session";
import { listRecentTransactions } from "@/server/queries/transactions";
import { listAccounts } from "@/server/queries/accounts";
import { getPlanAccess } from "@/server/queries/plan";
import { TransactionList } from "@/features/transactions/transaction-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "تراکنش‌ها" };

export default async function TransactionsPage() {
  const user = await requireUser();
  const [transactions, accounts, access] = await Promise.all([
    listRecentTransactions(user.id),
    listAccounts(user.id, { activeOnly: true }),
    getPlanAccess(user.id, user.plan),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
        <PageHeader
          title="تراکنش‌ها"
          action={
            transactions.length > 0 ? (
              access.canExport ? (
                <a href="/export/transactions" className="text-sm text-primary">
                  خروجی
                </a>
              ) : (
                <Link href="/pricing" className="text-sm text-muted-foreground">
                  خروجی
                </Link>
              )
            ) : undefined
          }
        />
      {transactions.length === 0 ? (
        <EmptyState
          title="هنوز تراکنشی ثبت نکردی"
          description="اولین هزینه را در چند ثانیه ثبت کن. لازم نیست هر جزئیاتی را همین حالا پر کنی."
          action={
            accounts.length === 0 ? (
              <Button asChild>
                <Link href="/accounts">اول یک حساب بساز</Link>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">از دکمه + پایین صفحه شروع کن.</p>
            )
          }
        />
      ) : (
        <TransactionList transactions={transactions} />
      )}
    </main>
  );
}
