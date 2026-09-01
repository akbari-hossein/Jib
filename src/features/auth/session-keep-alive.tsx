"use client";

import { useEffect } from "react";
import { refreshSession } from "@/server/actions/auth";

const VISIBILITY_REFRESH_MS = 6 * 60 * 60 * 1000;

export function SessionKeepAlive() {
  useEffect(() => {
    void refreshSession();

    let lastVisibilityRefresh = Date.now();
    function onVisibility() {
      if (document.visibilityState !== "visible") {
        return;
      }
      const now = Date.now();
      if (now - lastVisibilityRefresh < VISIBILITY_REFRESH_MS) {
        return;
      }
      lastVisibilityRefresh = now;
      void refreshSession();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
