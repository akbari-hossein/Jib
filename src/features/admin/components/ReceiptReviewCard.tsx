"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { formatJalaliDateTime } from "@/lib/admin/format";
import { REJECTION_REASON_CODES, REJECTION_REASON_COPY } from "@/lib/subscription/rejection-reasons";

export type AdminReceiptItem = {
  id: string;
  type: "IMAGE" | "TEXT";
  createdAt: string;
  claimedAmount: number | null;
  claimedTransferDate: string | null;
  imageUrl: string | null;
  rawText: string | null;
  user: { id: string; name: string | null; phone: string };
};

export function ReceiptReviewCard({ receipt }: { receipt: AdminReceiptItem }) {
  const router = useRouter();
  const [reasonCode, setReasonCode] = useState<(typeof REJECTION_REASON_CODES)[number]>("AMOUNT_MISMATCH");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/receipts/${receipt.id}/approve`, { method: "POST" });
    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "تأیید انجام نشد.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  async function reject() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/admin/receipts/${receipt.id}/reject`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reasonCode }),
    });
    if (!response.ok) {
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(json?.error ?? "رد کردن انجام نشد.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{receipt.user.name?.trim() || "بدون نام"}</p>
          <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
            {receipt.user.phone}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{formatJalaliDateTime(new Date(receipt.createdAt))}</p>
        </div>
        <p className="text-xs text-muted-foreground">{receipt.type === "IMAGE" ? "عکس" : "متن"}</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl bg-surface-muted">
        {receipt.type === "IMAGE" && receipt.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={receipt.imageUrl} alt="" className="max-h-80 w-full object-contain" />
        ) : (
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap px-4 py-3 text-sm leading-7">
            {receipt.rawText}
          </pre>
        )}
      </div>

      {receipt.claimedAmount != null ? (
        <p className="mt-3 text-xs text-muted-foreground">مبلغ اعلام‌شده: {receipt.claimedAmount.toLocaleString("fa-IR")}</p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={approve} disabled={pending} className="flex-1">
          تأیید
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setRejectOpen((open) => !open)}
          disabled={pending}
          className="flex-1"
        >
          رد کردن
        </Button>
      </div>

      {rejectOpen ? (
        <div className="mt-4 flex flex-col gap-3">
          <Label htmlFor={`reject-${receipt.id}`}>دلیل رد</Label>
          <NativeSelect
            id={`reject-${receipt.id}`}
            value={reasonCode}
            onChange={(event) =>
              setReasonCode(event.target.value as (typeof REJECTION_REASON_CODES)[number])
            }
          >
            {REJECTION_REASON_CODES.map((code) => (
              <option key={code} value={code}>
                {REJECTION_REASON_COPY[code]}
              </option>
            ))}
          </NativeSelect>
          <Button type="button" variant="destructive" onClick={reject} disabled={pending}>
            ثبت رد
          </Button>
        </div>
      ) : null}
    </article>
  );
}
