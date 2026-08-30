import { requireUser } from "@/lib/auth/session";
import { BudgetView } from "@/features/budgets/budget-view";
import { getBudgetMonth } from "@/server/queries/budgets";
import { getPlanAccess } from "@/server/queries/plan";

export const metadata = { title: "بودجه" };

export default async function BudgetsPage() {
  const user = await requireUser();
  const [budget, access] = await Promise.all([
    getBudgetMonth(user.id),
    getPlanAccess(user.id, user.plan),
  ]);
  return <BudgetView budget={budget} access={access} />;
}
