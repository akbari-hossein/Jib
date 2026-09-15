import { refreshAllSubscriptionStatuses } from "@/server/services/subscription";

export async function refreshSubscriptionStatuses(now = new Date()) {
  return refreshAllSubscriptionStatuses(now);
}
