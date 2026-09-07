import { requireUser } from "@/lib/auth/session";
import { TodayView } from "@/features/today/today-view";
import { getTodaySummary } from "@/lib/finance/today-summary";
import { getUnreadNotificationCount } from "@/server/queries/notifications";

export const metadata = { title: "خانه" };

export default async function HomePage() {
  const user = await requireUser();
  const [summary, unreadCount] = await Promise.all([
    getTodaySummary(user.id),
    getUnreadNotificationCount(user.id),
  ]);

  return <TodayView summary={summary} unreadCount={unreadCount} />;
}
