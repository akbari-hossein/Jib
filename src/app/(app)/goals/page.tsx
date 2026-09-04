import { requireUser } from "@/lib/auth/session";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { UpgradeCallout } from "@/components/upgrade-callout";
import { GoalForm } from "@/features/goals/goal-form";
import { GoalList } from "@/features/goals/goal-list";
import { limitCopy } from "@/lib/billing/plan";
import { listAccounts } from "@/server/queries/accounts";
import { listGoals } from "@/server/queries/goals";
import { getPlanAccess } from "@/server/queries/plan";

export const metadata = { title: "اهداف" };

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, accounts, access] = await Promise.all([
    listGoals(user.id),
    listAccounts(user.id, { activeOnly: true }),
    getPlanAccess(user.id, user.plan),
  ]);

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="اهداف"
        description="هدف بدون حساب از قابل‌خرج رزرو می‌شود. هدف وصل به حساب، موجودی همان حساب است."
        dataTour="goals-heading"
      />

      {goals.length === 0 ? (
        <EmptyState
          title="هنوز هدفی نداری"
          description="یک هدف مشخص کن تا بفهمی هر ماه چقدر باید کنار بگذاری و از قابل‌خرج جدا شود."
        />
      ) : (
        <GoalList goals={goals} />
      )}

      {access.canCreateGoal ? (
        <section className="rounded-3xl border border-border bg-card p-5">
          <h2 className="mb-4 text-base font-semibold">هدف جدید</h2>
          <GoalForm
            accounts={accounts.map((account) => ({
              id: account.id,
              name: account.name,
              type: account.type,
            }))}
          />
        </section>
      ) : (
        <UpgradeCallout title="سقف هدف رایگان" description={limitCopy("goals")} />
      )}
    </main>
  );
}
