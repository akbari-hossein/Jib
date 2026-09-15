"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { JalaliDateFields } from "@/components/jalali-date-fields";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/money/money-input";
import { parseJalaliForm } from "@/lib/dates/jalali-form";
import { getTehranJalaliDate, gregorianUtcFromJalali } from "@/lib/dates/tehran";
import { SUBSCRIPTION_COPY } from "@/lib/subscription/copy";
import { cn } from "@/lib/utils";

export function ReceiptUploadForm({
  pending,
  rejected,
}: {
  pending: boolean;
  rejected: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"IMAGE" | "TEXT">("IMAGE");
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<bigint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const today = getTehranJalaliDate();

  if (pending) {
    return (
      <div className="rounded-3xl border border-border bg-surface-muted px-5 py-5">
        <p className="text-sm leading-7 text-muted-foreground">{SUBSCRIPTION_COPY.receiptPending}</p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const parsedDate = parseJalaliForm(formData, "claimed");
      const claimedTransferDate =
        parsedDate.ok && parsedDate.value
          ? gregorianUtcFromJalali(parsedDate.value).toISOString()
          : undefined;

      let imageUrl: string | undefined;
      if (mode === "IMAGE") {
        if (!file) {
          setError("عکس رسید را انتخاب کن.");
          return;
        }
        const upload = new FormData();
        upload.append("file", file);
        const uploaded = await fetch("/api/subscription/receipts/upload", {
          method: "POST",
          body: upload,
        });
        const uploadJson = (await uploaded.json().catch(() => null)) as { imageUrl?: string; error?: string } | null;
        if (!uploaded.ok || !uploadJson?.imageUrl) {
          setError(uploadJson?.error ?? "آپلود عکس انجام نشد.");
          return;
        }
        imageUrl = uploadJson.imageUrl;
      }

      const response = await fetch("/api/subscription/receipts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: mode,
          imageUrl,
          rawText: mode === "TEXT" ? rawText : undefined,
          claimedAmount: claimedAmount != null ? Number(claimedAmount) : undefined,
          claimedTransferDate,
        }),
      });
      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(json?.error ?? "ارسال رسید انجام نشد.");
        return;
      }
      router.refresh();
    } catch {
      setError("ارسال رسید انجام نشد. دوباره تلاش کن.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {rejected ? (
        <p className="text-sm leading-7 text-muted-foreground">{SUBSCRIPTION_COPY.resubmitReceipt}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-muted p-1">
        <button
          type="button"
          onClick={() => setMode("IMAGE")}
          className={cn(
            "h-11 rounded-xl text-sm",
            mode === "IMAGE" ? "bg-card font-medium shadow-xs" : "text-muted-foreground",
          )}
        >
          {SUBSCRIPTION_COPY.uploadImage}
        </button>
        <button
          type="button"
          onClick={() => setMode("TEXT")}
          className={cn(
            "h-11 rounded-xl text-sm",
            mode === "TEXT" ? "bg-card font-medium shadow-xs" : "text-muted-foreground",
          )}
        >
          {SUBSCRIPTION_COPY.pasteText}
        </button>
      </div>

      {mode === "IMAGE" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="receipt-image">{SUBSCRIPTION_COPY.uploadImage}</Label>
          <input
            id="receipt-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-sm file:me-3 file:rounded-xl file:border-0 file:bg-surface-muted file:px-4 file:py-2"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="receipt-text">{SUBSCRIPTION_COPY.pasteText}</Label>
          <textarea
            id="receipt-text"
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            minLength={5}
            maxLength={2000}
            rows={6}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm leading-7 outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>{SUBSCRIPTION_COPY.claimedAmount}</Label>
        <MoneyInput onAmountChange={setClaimedAmount} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{SUBSCRIPTION_COPY.claimedDate}</Label>
        <JalaliDateFields prefix="claimed" optional minYear={today.year - 1} maxYear={today.year} />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "در حال ارسال…" : SUBSCRIPTION_COPY.submitReceipt}
      </Button>
    </form>
  );
}
