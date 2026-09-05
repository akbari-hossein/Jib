"use client";

import { useState, useTransition } from "react";
import { deleteTransaction } from "@/server/actions/transactions";
import { Button } from "@/components/ui/button";
import { formatToman } from "@/lib/currency/format";

export function DeleteTransactionButton({
  id,
  isAsset,
  amount,
}: {
  id: string;
  isAsset: boolean;
  amount: bigint;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      try {
        await deleteTransaction(formData);
      } catch {
        setError("حذف انجام نشد. دوباره تلاش کن.");
      }
    });
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-foreground/40"
        onClick={() => setConfirming(true)}
      >
        حذف
      </Button>
    );
  }

  return (
    <div className="flex max-w-[14rem] flex-col items-end gap-2">
      <p className="text-end text-[11px] leading-5 text-muted-foreground">
        {isAsset
          ? `حذف این حرکت، مقدار دارایی و رقم پس‌انداز همان ماه را عوض می‌کند${
              amount !== 0n ? ` (حدود ${formatToman(amount < 0n ? -amount : amount)})` : ""
            }.`
          : "این تراکنش از تاریخچه حذف می‌شود و موجودی حساب برمی‌گردد."}
      </p>
      {error ? (
        <p role="alert" className="text-[11px] text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-1">
        <Button type="button" variant="destructive" size="sm" className="h-7 px-2" disabled={pending} onClick={run}>
          {pending ? "…" : "حذف شود"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          disabled={pending}
          onClick={() => setConfirming(false)}
        >
          انصراف
        </Button>
      </div>
    </div>
  );
}
