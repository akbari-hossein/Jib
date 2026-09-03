"use client";

import { useEffect } from "react";
import { bindInstallPromptListeners } from "@/lib/pwa/deferred-prompt";

export function registerJibServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(undefined);
  }
  return navigator.serviceWorker.register("/sw.js");
}

export function PwaRegister() {
  useEffect(() => {
    bindInstallPromptListeners();
    if (process.env.NODE_ENV === "development") {
      return;
    }
    void registerJibServiceWorker();
  }, []);

  return null;
}
