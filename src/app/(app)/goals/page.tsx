import { requireUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmergencyFundCard, EmergencyFundSetupCard } from "@/features/emergency-fund/components/EmergencyFundCard";
import { GoalForm } from "@/features/goals/goal-form";
import { GoalList } from "@/features/goals/goal-list";
import { listAccounts } from "@/server/queries/accounts";
import { listGoals } from "@/server/queries/goals";
import { getEmergencyFundData } from "@/server/emergencyFund/getEmergencyFundData";

export const metadata = { title: "اهداف" };

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, accounts, emergency] = await Promise.all([
    listGoals(user.id),
    listAccounts(user.id, { activeOnly: true }),
    getEmergencyFundData(user.id),
  ]);
  const customGoals = goals.filter((goal) => goal.type !== "EMERGENCY_FUND");

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <PageHeader
        title="اهداف"
        description="هدف بدون حساب از قابل‌خرج رزرو می‌شود. هدف وصل به حساب، موجودی همان حساب است."
        dataTour="goals-heading"
      />

      {emergency.configured && emergency.goal ? (
        <EmergencyFundCard
          currentAmount={emergency.progress.currentAmount}
          targetAmount={emergency.progress.targetAmount}
          progressPercent={emergency.progress.progressPercent}
        />
      ) : (
        <EmergencyFundSetupCard />
      )}

      {customGoals.length === 0 ? null : <GoalList goals={customGoals} />}

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">هدف جدید</h2>
        <GoalForm accounts={accounts.map((account) => ({ id: account.id, name: account.name }))} />
      </section>
    </main>
  );
}
