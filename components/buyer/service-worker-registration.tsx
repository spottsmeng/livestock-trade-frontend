"use client";

import * as React from "react";
import { useAuthStore } from "@/lib/auth-store";
import { ensurePushSubscription } from "@/lib/buyer/push-subscribe";
import { flushPendingEntries, setupAutoSync } from "@/lib/buyer/sync";

/**
 * Registers public/sw.js scoped to /buyer/ only (§12.7) — this is the one
 * place the service worker is ever registered, mirroring how
 * components/theme-toggle.tsx is the one place `data-theme` is ever set.
 * Also the one place lib/buyer/sync.ts's online-event + periodic retry
 * loop is started — it must run for the whole buyer session, not just
 * while the Buy Log screen happens to be mounted.
 */
export function ServiceWorkerRegistration() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/buyer/" })
      .then(() => ensurePushSubscription(useAuthStore.getState().accessToken))
      .catch(() => {
        // Offline capability degrades gracefully without a SW — not fatal.
      });

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "flush-buy-entries") void flushPendingEntries(useAuthStore.getState().accessToken);
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, []);

  React.useEffect(() => setupAutoSync(() => useAuthStore.getState().accessToken), []);

  return null;
}
