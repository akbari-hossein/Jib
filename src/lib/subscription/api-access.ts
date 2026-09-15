import type { ReceiptStatus, UserRole, UserStatus } from "@prisma/client";
import { isActiveAdmin } from "@/lib/admin/access";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";

export function subscriptionOwnerWhere(sessionUserId: string) {
  return { userId: sessionUserId };
}

export function pickLatestReceipt<T extends { createdAt: Date; status: ReceiptStatus }>(
  receipts: T[],
): T | null {
  if (receipts.length === 0) {
    return null;
  }
  return [...receipts].sort((left, right) => {
    const byDate = right.createdAt.getTime() - left.createdAt.getTime();
    return byDate !== 0 ? byDate : 0;
  })[0]!;
}

export function canSubmitReceipt(pendingCount: number): { ok: true } | { ok: false; status: 409; error: string } {
  if (pendingCount > 0) {
    return { ok: false, status: 409, error: SUBSCRIPTION_COPY.duplicatePending };
  }
  return { ok: true };
}

export function authorizeReceiptReview(input: {
  actor: { role: UserRole; status: UserStatus } | null;
  receipt: { id: string; subscriptionId: string } | null;
}): { allowed: true } | { allowed: false; status: 401 | 403 | 404 } {
  if (!input.actor) {
    return { allowed: false, status: 401 };
  }
  if (!isActiveAdmin(input.actor)) {
    return { allowed: false, status: 403 };
  }
  if (!input.receipt) {
    return { allowed: false, status: 404 };
  }
  return { allowed: true };
}

export function authorizeAdminList(actor: { role: UserRole; status: UserStatus } | null): {
  allowed: boolean;
  status?: 401 | 403;
} {
  if (!actor) {
    return { allowed: false, status: 401 };
  }
  if (!isActiveAdmin(actor)) {
    return { allowed: false, status: 403 };
  }
  return { allowed: true };
}
