"use client";

import { useEffect } from "react";

export function registerJibServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(undefined);
  }
  return navigator.serviceWorker.register("/sw.js");
}

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      return;
    }
    void registerJibServiceWorker();
  }, []);

  return null;
}
