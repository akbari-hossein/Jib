import { requireUser } from "@/lib/auth/session";
import { TodayView } from "@/features/today/today-view";
import { getTodaySummary } from "@/lib/finance/today-summary";
import { getUnreadNotificationCount } from "@/server/queries/notifications";
import { getFinancialHealth, widgetFromHealth } from "@/server/queries/financial-health";
import { getEmergencyFundData } from "@/server/emergencyFund/getEmergencyFundData";
import { syncGeneratedFinancialTasks } from "@/server/services/financial-tasks";

export const metadata = { title: "خانه" };

export default async function HomePage() {
  const user = await requireUser();
  await syncGeneratedFinancialTasks(user.id);
  const [summary, unreadCount, health, emergencyFund] = await Promise.all([
    getTodaySummary(user.id),
    getUnreadNotificationCount(user.id),
    getFinancialHealth(user.id),
    getEmergencyFundData(user.id),
  ]);

  return (
    <TodayView
      summary={summary}
      unreadCount={unreadCount}
      health={widgetFromHealth(health)}
      emergencyFund={emergencyFund}
    />
  );
}
