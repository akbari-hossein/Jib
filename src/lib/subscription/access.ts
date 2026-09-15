import type { SubscriptionStatus } from "@prisma/client";

export function hasWriteAccess(status: SubscriptionStatus): boolean {
  return status === "ACTIVE" || status === "TRIALING";
}

export function isReadOnlyStatus(status: SubscriptionStatus): boolean {
  return status === "PENDING_REVIEW" || status === "EXPIRED" || status === "REJECTED";
}

export class WriteAccessBlockedError extends Error {
  constructor() {
    super("WRITE_ACCESS_BLOCKED");
    this.name = "WriteAccessBlockedError";
  }
}
