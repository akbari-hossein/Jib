import { requireUser } from "@/lib/auth/session";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboard } from "@/server/queries/dashboard";

export const metadata = { title: "خانه" };

export default async function HomePage() {
  const user = await requireUser();
  const dashboard = await getDashboard(user.id, user.incomeDayOfMonth);

  return <DashboardView dashboard={dashboard} name={user.name} />;
}
