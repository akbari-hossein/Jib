"use client";

import Link from "next/link";
import { SUBSCRIPTION_COPY, rejectionCopy, trialExpiredCopy } from "@/lib/subscription/copy";
import { useSubscriptionAccess } from "@/features/subscription/subscription-access";

export function SubscriptionNotice() {
  const snapshot = useSubscriptionAccess();
  if (!snapshot) {
    return null;
  }

  if (snapshot.status === "PENDING_REVIEW") {
    return (
      <div role="status" className="border-b border-border bg-surface-muted px-4 py-3 text-sm leading-7">
        {SUBSCRIPTION_COPY.receiptPending}{" "}
        <Link href="/upgrade" className="font-medium text-primary">
          جزئیات
        </Link>
      </div>
    );
  }

  if (snapshot.status === "EXPIRED") {
    return (
      <div role="status" className="border-b border-border bg-surface-muted px-4 py-3 text-sm leading-7">
        {trialExpiredCopy(snapshot.priceToman)}{" "}
        <Link href="/upgrade" className="font-medium text-primary">
          {SUBSCRIPTION_COPY.activateCta}
        </Link>
      </div>
    );
  }

  if (snapshot.status === "REJECTED") {
    return (
      <div role="status" className="border-b border-border bg-surface-muted px-4 py-3 text-sm leading-7">
        {rejectionCopy(snapshot.latestReceipt?.rejectionReasonCode ?? null)}{" "}
        <Link href="/upgrade" className="font-medium text-primary">
          {SUBSCRIPTION_COPY.resubmitReceipt}
        </Link>
      </div>
    );
  }

  return null;
}
