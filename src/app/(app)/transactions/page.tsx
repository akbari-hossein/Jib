import { EmptyState } from "@/components/empty-state";

export default function TransactionsPage() {
  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">تراکنش‌ها</h1>
      <EmptyState
        title="هنوز تراکنشی ثبت نکردی"
        description="اولین هزینه‌ات را در چند ثانیه ثبت کن. لازم نیست هر جزئیاتی را همین حالا پر کنی."
      />
    </main>
  );
}
