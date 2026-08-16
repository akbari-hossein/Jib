import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";
import { GoalForm } from "@/features/goals/goal-form";
import { GoalList } from "@/features/goals/goal-list";
import { listAccounts } from "@/server/queries/accounts";
import { listGoals } from "@/server/queries/goals";

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, accounts] = await Promise.all([
    listGoals(user.id),
    listAccounts(user.id, { activeOnly: true }),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">اهداف</h1>
        <p className="mt-2 text-sm leading-7 text-foreground/60">
          هدف بدون حساب از قابل‌خرج رزرو می‌شود. هدف وصل به حساب، موجودی همان حساب است.
        </p>
      </header>

      {goals.length === 0 ? (
        <EmptyState
          title="برای اولین هدفت آماده‌ای؟"
          description="یک هدف مشخص کن تا بفهمی هر ماه چقدر باید کنار بگذاری."
        />
      ) : (
        <GoalList goals={goals} />
      )}

      <section className="rounded-3xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-base font-semibold">هدف جدید</h2>
        <GoalForm accounts={accounts.map((account) => ({ id: account.id, name: account.name }))} />
      </section>
    </main>
  );
}
