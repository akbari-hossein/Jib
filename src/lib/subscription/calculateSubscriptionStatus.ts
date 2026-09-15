import type { ReceiptStatus, SubscriptionStatus } from "@prisma/client";

export type SubscriptionStatusInput = {
  now: Date;
  trialEndsAt: Date;
  currentPeriodEnd: Date | null;
  latestReceiptStatus: ReceiptStatus | null;
};

export function calculateSubscriptionStatus(input: SubscriptionStatusInput): SubscriptionStatus {
  const { now, trialEndsAt, currentPeriodEnd, latestReceiptStatus } = input;

  if (currentPeriodEnd && now.getTime() < currentPeriodEnd.getTime()) {
    return "ACTIVE";
  }
  if (latestReceiptStatus === "PENDING") {
    return "PENDING_REVIEW";
  }
  if (now.getTime() < trialEndsAt.getTime()) {
    return "TRIALING";
  }
  if (latestReceiptStatus === "REJECTED") {
    return "REJECTED";
  }
  return "EXPIRED";
}
