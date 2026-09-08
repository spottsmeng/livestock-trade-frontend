"use client";

import * as React from "react";
import { strings } from "@/lib/strings";

export function useOnlineStatus(): boolean {
  const [online, setOnline] = React.useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);
  return online;
}

/** §12.2 — "Offline shows a grey/amber rail with the last-synced
 * timestamp — never a silent stale number." */
export function OfflineBanner({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-status-close-border bg-status-close-bg px-4 py-2 text-sm font-medium text-status-close-fg"
    >
      {strings.buyer.dnbpHome.offline}
      {lastSyncedAt ? ` · last synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : null}
    </div>
  );
}
