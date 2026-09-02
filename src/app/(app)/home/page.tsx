import { requireUser } from "@/lib/auth/session";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboard } from "@/server/queries/dashboard";
import { getUnreadNotificationCount } from "@/server/queries/notifications";
import { getPreviousMonthRecapPrompt } from "@/server/queries/reports";

export const metadata = { title: "خانه" };

export default async function HomePage() {
  const user = await requireUser();
  const [dashboard, unreadCount, previousRecap] = await Promise.all([
    getDashboard(user.id, user.incomeDayOfMonth),
    getUnreadNotificationCount(user.id),
    getPreviousMonthRecapPrompt(user.id),
  ]);

  return (
    <DashboardView
      dashboard={dashboard}
      name={user.name}
      unreadCount={unreadCount}
      previousRecap={previousRecap}
    />
  );
}
