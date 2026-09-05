"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { urlBase64ToUint8Array } from "@/lib/notifications/push-encoding";
import { registerJibServiceWorker } from "@/components/pwa/pwa-register";

type PushStatus = "unsupported" | "no-key" | "on" | "off" | "denied" | "busy" | "error";

function initialPushStatus(vapidPublicKey: string | null, initiallySubscribed: boolean): PushStatus {
  if (!vapidPublicKey) {
    return "no-key";
  }
  if (typeof window === "undefined") {
    return initiallySubscribed ? "on" : "off";
  }
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  return initiallySubscribed ? "on" : "off";
}

export function PushToggle({
  vapidPublicKey,
  initiallySubscribed,
}: {
  vapidPublicKey: string | null;
  initiallySubscribed: boolean;
}) {
  const [status, setStatus] = useState<PushStatus>(() =>
    initialPushStatus(vapidPublicKey, initiallySubscribed),
  );

  useEffect(() => {
    if (!vapidPublicKey) {
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return;
    }
    if (Notification.permission === "denied") {
      return;
    }

    let cancelled = false;
    void navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) {
          setStatus(subscription ? "on" : "off");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus(initiallySubscribed ? "on" : "off");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initiallySubscribed, vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) {
      return;
    }
    setStatus("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await registerJibServiceWorker();
      if (!registration) {
        setStatus("unsupported");
        return;
      }
      const ready = await navigator.serviceWorker.ready;
      const subscription =
        (await ready.pushManager.getSubscription()) ??
        (await ready.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        }));
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
        setStatus("error");
        return;
      }
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      setStatus(response.ok ? "on" : "error");
    } catch {
      setStatus("error");
    }
  }

  async function disable() {
    setStatus("busy");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return <p className="text-sm leading-7 text-muted-foreground">این مرورگر اعلان وب را پشتیبانی نمی‌کند.</p>;
  }
  if (status === "no-key") {
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        اعلان مرورگر روی این سرور تنظیم نشده. تاریخچه اعلان‌ها همچنان داخل برنامه می‌ماند.
      </p>
    );
  }
  if (status === "denied") {
    return (
      <p className="text-sm leading-7 text-muted-foreground">
        اجازه اعلان در تنظیمات مرورگر خاموش است. می‌توانی از مرکز اعلان داخل برنامه استفاده کنی.
      </p>
    );
  }

  const on = status === "on";

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">اعلان مرورگر</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          روی گوشی نصب‌شده، همان پیام در اعلان سیستم هم می‌آید.
        </p>
      </div>
      <Button
        type="button"
        variant={on ? "secondary" : "default"}
        size="sm"
        disabled={status === "busy"}
        onClick={() => {
          void (on ? disable() : enable());
        }}
      >
        {status === "busy" ? "…" : on ? "روشن" : "فعال کن"}
      </Button>
    </div>
  );
}
