import { requireUser } from "@/lib/auth/session";
import { getTodaySummary } from "@/lib/finance/today-summary";

export async function getTodaySummaryForSession(now: Date = new Date()) {
  const user = await requireUser();
  return getTodaySummary(user.id, now);
}
