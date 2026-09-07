"use client";

import { useState, useSyncExternalStore } from "react";
import { MonthlyRecapShareSheet } from "@/features/reports/monthly-recap-share";
import { Button } from "@/components/ui/button";
import type { MonthlyRecapDto } from "@/lib/finance/monthly-recap-data";
import { dismissRecapPrompt, isRecapPromptDismissed } from "@/lib/share/recap-prompt-storage";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function MonthlyRecapPrompt({ recap }: { recap: MonthlyRecapDto }) {
  const storedDismissed = useSyncExternalStore(
    subscribe,
    () => isRecapPromptDismissed(recap.year, recap.month),
    () => true,
  );
  const [locallyDismissed, setLocallyDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (storedDismissed || locallyDismissed) {
    return null;
  }

  function dismiss() {
    dismissRecapPrompt(recap.year, recap.month);
    setLocallyDismissed(true);
  }

  return (
    <>
      <section className="rounded-3xl border border-border bg-card px-5 py-4">
        <p className="text-sm leading-7">خلاصه ماه قبل آماده‌ست. می‌خوای ببینی؟</p>
        <div className="mt-3 flex gap-2">
          <Button type="button" size="sm" onClick={() => setOpen(true)}>
            ببین
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
            بعداً
          </Button>
        </div>
      </section>
      <MonthlyRecapShareSheet recap={recap} open={open} onOpenChange={setOpen} />
    </>
  );
}
