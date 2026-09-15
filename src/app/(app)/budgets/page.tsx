import { requireUser } from "@/lib/auth/session";
import { BudgetView } from "@/features/budgets/budget-view";
import { getBudgetMonth } from "@/server/queries/budgets";
import { getCachedSubscription } from "@/server/services/subscription";

export const metadata = { title: "بودجه" };

export default async function BudgetsPage() {
  const user = await requireUser();
  const [budget, snapshot] = await Promise.all([
    getBudgetMonth(user.id),
    getCachedSubscription(user.id),
  ]);
  return <BudgetView budget={budget} writeAccess={snapshot.writeAccess} />;
}
