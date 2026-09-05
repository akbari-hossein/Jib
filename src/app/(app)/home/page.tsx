import { requireUser } from "@/lib/auth/session";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getBudgetMonth } from "@/server/queries/budgets";
import { getDashboard } from "@/server/queries/dashboard";
import { getUnreadNotificationCount } from "@/server/queries/notifications";
import { getPreviousMonthRecapPrompt } from "@/server/queries/reports";

export const metadata = { title: "خانه" };

export default async function HomePage() {
  const user = await requireUser();
  const [dashboard, unreadCount, previousRecap, budget] = await Promise.all([
    getDashboard(user.id, user.incomeDayOfMonth, user.referenceAssetPreference),
    getUnreadNotificationCount(user.id),
    getPreviousMonthRecapPrompt(user.id),
    getBudgetMonth(user.id),
  ]);

  return (
    <DashboardView
      dashboard={dashboard}
      name={user.name}
      unreadCount={unreadCount}
      previousRecap={previousRecap}
      affordability={{
        availableMoney: dashboard.availableMoney.toString(),
        remainingToday: dashboard.remainingToday.toString(),
        spentToday: dashboard.spentToday.toString(),
        remainingDays: dashboard.remainingDays,
        budgets: budget.items.map((item) => ({
          categoryId: item.categoryId,
          name: item.name,
          spent: item.spent.toString(),
          limit: item.limit.toString(),
        })),
      }}
    />
  );
}
