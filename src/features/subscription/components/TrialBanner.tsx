"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { shouldShowTrialReminder } from "@/lib/subscription/shouldShowTrialReminder";
import { SUBSCRIPTION_COPY, trialReminderCopy } from "@/lib/subscription/copy";
import { useSubscriptionAccess } from "@/features/subscription/subscription-access";

const STORAGE_PREFIX = "jib-trial-banner:";

function subscribe() {
  return () => undefined;
}

function readDismissed(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function TrialBanner() {
  const snapshot = useSubscriptionAccess();
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const daysRemaining = snapshot?.daysRemaining ?? -1;
  const visible = snapshot?.status === "TRIALING" && shouldShowTrialReminder(daysRemaining);
  const storageKey = `${STORAGE_PREFIX}${daysRemaining}`;
  const storedDismissed = useSyncExternalStore(
    subscribe,
    () => (visible ? readDismissed(storageKey) : true),
    () => true,
  );

  if (!visible || dismissedKey === storageKey || storedDismissed) {
    return null;
  }

  const copy = trialReminderCopy(daysRemaining);
  if (!copy) {
    return null;
  }

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore quota / private mode */
    }
    setDismissedKey(storageKey);
  }

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 border-b border-border bg-surface-muted px-4 py-3 text-sm leading-7 text-foreground"
    >
      <p>
        {copy}{" "}
        <Link href="/upgrade" className="font-medium text-primary">
          {SUBSCRIPTION_COPY.activateCta}
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
      >
        بستن
      </button>
    </div>
  );
}
