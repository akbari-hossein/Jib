"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { hasWriteAccess } from "@/lib/subscription/access";
import { SUBSCRIPTION_COPY, writeBlockedCopy } from "@/lib/subscription/copy";
import { useSubscriptionAccess } from "@/features/subscription/subscription-access";
import type { SubscriptionStatus } from "@prisma/client";

export function ReadOnlyOverlay({
  children,
  status,
}: {
  children?: ReactNode;
  status?: SubscriptionStatus;
}) {
  const snapshot = useSubscriptionAccess();
  const resolved = status ?? snapshot?.status;
  if (!resolved || hasWriteAccess(resolved)) {
    return <>{children}</>;
  }

  return (
    <div className="rounded-3xl border border-border bg-surface-muted px-5 py-5">
      <p className="text-sm leading-7 text-muted-foreground">{writeBlockedCopy(resolved)}</p>
      <Link href="/upgrade" className="mt-3 inline-flex text-sm font-medium text-primary">
        {resolved === "PENDING_REVIEW" ? "وضعیت رسید" : SUBSCRIPTION_COPY.activateCta}
      </Link>
    </div>
  );
}
