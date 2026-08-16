import { requireUser } from "@/lib/auth/session";
import { listRecentTransactions } from "@/server/queries/transactions";
import { listAccounts } from "@/server/queries/accounts";
import { TransactionList } from "@/features/transactions/transaction-list";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function TransactionsPage() {
  const user = await requireUser();
  const [transactions, accounts] = await Promise.all([
    listRecentTransactions(user.id),
    listAccounts(user.id, { activeOnly: true }),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">تراکنش‌ها</h1>
      {transactions.length === 0 ? (
        <EmptyState
          title="هنوز تراکنشی ثبت نکردی"
          description="اولین هزینه‌ات را در چند ثانیه ثبت کن. لازم نیست هر جزئیاتی را همین حالا پر کنی."
          action={
            accounts.length === 0 ? (
              <Button asChild>
                <Link href="/accounts">اول یک حساب بساز</Link>
              </Button>
            ) : (
              <p className="text-sm text-foreground/55">از دکمه + پایین صفحه شروع کن.</p>
            )
          }
        />
      ) : (
        <TransactionList transactions={transactions} />
      )}
    </main>
  );
}
