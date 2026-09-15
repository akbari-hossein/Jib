import { DAY_MS } from "@/lib/subscription/constants";

export function calculateTrialDaysRemaining(now: Date, trialEndsAt: Date): number {
  return Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / DAY_MS));
}
