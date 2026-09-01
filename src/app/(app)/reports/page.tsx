import { requireUser } from "@/lib/auth/session";
import { ReportsView } from "@/features/reports/reports-view";
import { getReports } from "@/server/queries/reports";

export const metadata = { title: "گزارش‌ها" };

export default async function ReportsPage() {
  const user = await requireUser();
  const reports = await getReports(user.id, user.referenceAssetPreference);
  return <ReportsView reports={reports} />;
}
