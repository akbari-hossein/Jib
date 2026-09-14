import { requireUser } from "@/lib/auth/session";
import { CalculatorsView } from "@/features/calculators/calculators-view";

export const metadata = { title: "محاسبه‌گر مالی" };

export default async function CalculatorsPage() {
  await requireUser();
  return <CalculatorsView />;
}
