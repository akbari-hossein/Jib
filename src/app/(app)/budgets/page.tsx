import { requireUser } from "@/lib/auth/session";
import { BudgetView } from "@/features/budgets/budget-view";
import { getBudgetMonth } from "@/server/queries/budgets";

export default async function BudgetsPage() {
  const user = await requireUser();
  const budget = await getBudgetMonth(user.id);
  return <BudgetView budget={budget} />;
}
