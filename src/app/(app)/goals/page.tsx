import { EmptyState } from "@/components/empty-state";

export default function GoalsPage() {
  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <h1 className="text-2xl font-semibold tracking-tight">اهداف</h1>
      <EmptyState
        title="برای اولین هدفت آماده‌ای؟"
        description="یک هدف مشخص کن تا بفهمی هر ماه چقدر باید کنار بگذاری."
      />
    </main>
  );
}
