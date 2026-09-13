import { requireUser } from "@/lib/auth/session";
import { HealthScoreView } from "@/features/health-score/health-score-view";
import { getFinancialHealth } from "@/server/queries/financial-health";

export const metadata = { title: "امتیاز مالی" };

export default async function HealthScorePage() {
  const user = await requireUser();
  const health = await getFinancialHealth(user.id);
  return <HealthScoreView health={health} />;
}
