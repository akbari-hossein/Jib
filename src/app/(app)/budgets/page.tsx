import { EmptyState } from "@/components/empty-state";

export default function BudgetsPage() {
  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">بودجه</h1>
      <EmptyState
        title="هنوز بودجه‌ای نداری"
        description="برای دسته‌های مهم مثل غذا سقف بگذار تا وسط ماه غافلگیر نشوی."
      />
    </main>
  );
}
