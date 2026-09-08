"use client";

import * as React from "react";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { BuyerBottomNav } from "@/components/buyer/bottom-nav";
import { OfflineBanner, useOnlineStatus } from "@/components/buyer/offline-banner";
import { InstallPrompt } from "@/components/buyer/install-prompt";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import { buyerApi, connectBuyerSocket, type DnbpCurrentResponse } from "@/lib/buyer-api";
import { cacheDnbp, getCachedDnbp, type CachedDnbp } from "@/lib/buyer/db";

// §3, §12.2 — a publication older than this is stale even if it's still
// technically "current" (nothing newer has been published since).
const STALE_INSTRUCTION_HOURS = 24;

export default function BuyerDnbpHomePage() {
  return (
    <AuthGuard requiredRole="BUYER">
      <AppShell title={strings.buyer.dnbpHome.title}>
        <DnbpHomeContent />
      </AppShell>
      <BuyerBottomNav />
    </AuthGuard>
  );
}

function DnbpHomeContent() {
  const online = useOnlineStatus();
  const [cached, setCached] = React.useState<CachedDnbp | null>(null);
  const acknowledgedRef = React.useRef<string | null>(null);

  const applyFresh = React.useCallback(async (data: DnbpCurrentResponse) => {
    await cacheDnbp(data);
    setCached((await getCachedDnbp()) ?? null);
    if (acknowledgedRef.current !== data.publication_id) {
      acknowledgedRef.current = data.publication_id;
      buyerApi.ackDnbp(data.publication_id, useAuthStore.getState().accessToken).catch(() => {
        // Ack is best-effort from the client's perspective — the console's
        // delivery tracker will simply show "not yet seen" a little longer.
      });
    }
  }, []);

  const loadFromCacheThenNetwork = React.useCallback(async () => {
    setCached((await getCachedDnbp()) ?? null);
    try {
      const data = await buyerApi.getDnbpCurrent(useAuthStore.getState().accessToken);
      await applyFresh(data);
    } catch {
      // Offline or nothing published yet — the cached value (if any) stays displayed.
    }
  }, [applyFresh]);

  React.useEffect(() => {
    void (async () => {
      await loadFromCacheThenNetwork();
    })();
  }, [loadFromCacheThenNetwork]);

  React.useEffect(() => {
    const socket = connectBuyerSocket(
      () => useAuthStore.getState().accessToken,
      (event, data) => {
        if (event === "dnbp.published") void applyFresh(data as DnbpCurrentResponse);
      },
      () => void loadFromCacheThenNetwork() // always re-fetch on (re)connect, per §10
    );

    // §10 polling fallback — every 60s while foregrounded, in case both WS
    // and push fail (e.g. poor rural connectivity).
    const pollId = setInterval(() => void loadFromCacheThenNetwork(), 60_000);

    return () => {
      socket.close();
      clearInterval(pollId);
    };
  }, [loadFromCacheThenNetwork, applyFresh]);

  if (!cached) {
    return <EmptyState title={strings.buyer.dnbpHome.noPublication} />;
  }

  const publishedAt = new Date(cached.published_at);
  const isStale = Date.now() - publishedAt.getTime() > STALE_INSTRUCTION_HOURS * 60 * 60 * 1000;
  const fetchedAt = new Date(cached.fetched_at);
  const minutesAgo = Math.max(0, Math.round((Date.now() - fetchedAt.getTime()) / 60000));

  return (
    <div className="flex flex-col">
      <OfflineBanner lastSyncedAt={cached.fetched_at} />
      <InstallPrompt />

      <div className="flex items-center justify-between border-b border-subtle px-4 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span
            className={online ? "h-2.5 w-2.5 rounded-full bg-status-pass-border" : "h-2.5 w-2.5 rounded-full bg-status-close-border"}
            aria-hidden
          />
          {online ? strings.buyer.dnbpHome.live : strings.buyer.dnbpHome.offline}
        </span>
        <span className="text-fg-tertiary">
          {strings.buyer.dnbpHome.updatedPrefix} {minutesAgo === 0 ? "just now" : `${minutesAgo} min ago`}
        </span>
      </div>

      {isStale ? (
        <div
          role="alert"
          aria-live="assertive"
          className="border-b border-status-close-border bg-status-close-bg px-4 py-3 text-sm font-medium text-status-close-fg"
        >
          {strings.buyer.dnbpHome.stale}
        </div>
      ) : null}

      <div className="flex flex-col">
        {cached.species.map((line) => (
          <div key={line.species} className="border-b border-subtle px-4 py-6">
            <p className="text-lg font-semibold uppercase tracking-wide text-fg-secondary">{line.species}</p>
            <p
              data-numeric
              className="mt-1 text-6xl font-bold leading-none text-accent-default"
              style={{ fontFeatureSettings: '"tnum" 1' }}
            >
              ${line.dnbp_per_kg}
            </p>
            <p className="mt-2 text-sm text-fg-tertiary">
              {strings.buyer.dnbpHome.perKg}
              {line.target_heads ? ` · ${Math.round(Number(line.target_heads))} ${strings.buyer.dnbpHome.headsSuffix}` : ""}
              {line.weight_band
                ? ` · ${Number(line.weight_band.min).toFixed(1)}–${Number(line.weight_band.max).toFixed(1)} kg`
                : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
