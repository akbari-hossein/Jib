"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCardNumber } from "@/lib/subscription/format-card";
import { SUBSCRIPTION_COPY, approvedCopy, rejectionCopy } from "@/lib/subscription/copy";
import { formatJalaliAbsolute } from "@/lib/admin/format";
import { formatToman } from "@/lib/currency/format";
import { ReceiptUploadForm } from "@/features/subscription/components/ReceiptUploadForm";
import type { ClientSubscriptionSnapshot } from "@/features/subscription/subscription-access";

export function UpgradeScreen({ snapshot }: { snapshot: ClientSubscriptionSnapshot }) {
  const [copied, setCopied] = useState(false);
  const pending = snapshot.latestReceipt?.status === "PENDING";
  const rejected = snapshot.status === "REJECTED";
  const activeUntil =
    snapshot.status === "ACTIVE" && snapshot.currentPeriodEnd
      ? formatJalaliAbsolute(new Date(snapshot.currentPeriodEnd))
      : null;

  async function copyCard() {
    if (!snapshot.cardNumber) {
      return;
    }
    try {
      await navigator.clipboard.writeText(snapshot.cardNumber.replace(/\s+/g, ""));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="flex flex-col gap-6 px-5 pt-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{SUBSCRIPTION_COPY.upgradeTitle}</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          {snapshot.status === "PENDING_REVIEW"
            ? SUBSCRIPTION_COPY.receiptPending
            : snapshot.status === "ACTIVE" && activeUntil
              ? approvedCopy(activeUntil)
              : snapshot.status === "EXPIRED"
                ? SUBSCRIPTION_COPY.trialExpired
                : SUBSCRIPTION_COPY.paymentInstructions}
        </p>
      </header>

      {rejected && snapshot.latestReceipt?.rejectionReasonCode ? (
        <section className="rounded-3xl border border-border bg-card px-5 py-4">
          <p className="text-sm leading-7">{rejectionCopy(snapshot.latestReceipt.rejectionReasonCode)}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card px-5 py-5">
        <p className="text-xs text-muted-foreground">مبلغ ماهانه</p>
        <p className="numeric-display mt-1 text-2xl font-semibold">
          {formatToman(BigInt(snapshot.priceToman))}
        </p>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{SUBSCRIPTION_COPY.paymentInstructions}</p>
        <div className="mt-4 rounded-2xl bg-surface-muted px-4 py-4">
          <p className="text-xs text-muted-foreground">شماره کارت جیب</p>
          <p className="numeric-display mt-2 text-lg font-semibold tracking-wide" dir="ltr">
            {snapshot.cardNumber ? formatCardNumber(snapshot.cardNumber) : "—"}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-3 w-full"
            onClick={copyCard}
            disabled={!snapshot.cardNumber}
          >
            {copied ? SUBSCRIPTION_COPY.cardCopied : SUBSCRIPTION_COPY.copyCard}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card px-5 py-5">
        <h2 className="mb-4 text-base font-semibold">ارسال رسید</h2>
        <ReceiptUploadForm pending={pending} rejected={rejected} />
      </section>
    </main>
  );
}
