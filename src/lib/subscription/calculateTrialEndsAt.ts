import { addUtcDays } from "@/lib/subscription/addUtcDays";
import { TRIAL_DAYS } from "@/lib/subscription/constants";

export function calculateTrialEndsAt(createdAt: Date): Date {
  return addUtcDays(createdAt, TRIAL_DAYS);
}
