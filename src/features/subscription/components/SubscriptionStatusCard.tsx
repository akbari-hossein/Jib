import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatJalaliAbsolute } from "@/lib/admin/format";
import { formatToman } from "@/lib/currency/format";
import { SUBSCRIPTION_STATUS_LABEL } from "@/lib/subscription/admin-copy";
import { SUBSCRIPTION_COPY, approvedCopy, rejectionCopy } from "@/lib/subscription/copy";
import type { ClientSubscriptionSnapshot } from "@/features/subscription/subscription-access";

export function SubscriptionStatusCard({ snapshot }: { snapshot: ClientSubscriptionSnapshot }) {
  const periodEnd = snapshot.currentPeriodEnd
    ? formatJalaliAbsolute(new Date(snapshot.currentPeriodEnd))
    : null;
  const showRenew =
    snapshot.status === "EXPIRED" ||
    snapshot.status === "REJECTED" ||
    snapshot.status === "TRIALING" ||
    snapshot.status === "PENDING_REVIEW" ||
    snapshot.status === "ACTIVE";

  return (
    <section className="rounded-3xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold">{SUBSCRIPTION_COPY.statusCardTitle}</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">وضعیت</dt>
          <dd className="mt-1">{SUBSCRIPTION_STATUS_LABEL[snapshot.status]}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">مبلغ</dt>
          <dd className="mt-1">{formatToman(BigInt(snapshot.priceToman))}</dd>
        </div>
        {periodEnd ? (
          <div>
            <dt className="text-xs text-muted-foreground">تا تاریخ</dt>
            <dd className="mt-1">{periodEnd}</dd>
          </div>
        ) : null}
      </dl>
      {snapshot.status === "ACTIVE" && periodEnd ? (
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{approvedCopy(periodEnd)}</p>
      ) : null}
      {snapshot.status === "REJECTED" && snapshot.latestReceipt?.rejectionReasonCode ? (
        <p className="mt-4 text-sm leading-7">{rejectionCopy(snapshot.latestReceipt.rejectionReasonCode)}</p>
      ) : null}
      {snapshot.status === "PENDING_REVIEW" ? (
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{SUBSCRIPTION_COPY.receiptPending}</p>
      ) : null}
      {showRenew ? (
        <Button asChild className="mt-5 w-full" variant={snapshot.status === "ACTIVE" ? "secondary" : "default"}>
          <Link href="/upgrade">
            {snapshot.status === "ACTIVE" ? SUBSCRIPTION_COPY.renewCta : SUBSCRIPTION_COPY.activateCta}
          </Link>
        </Button>
      ) : null}
    </section>
  );
}
