"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { StatTile } from "@/components/ui/stat-tile";
import { OrderBookPanel } from "@/components/dashboard/order-book-panel";
import { DnbpTrendPanel } from "@/components/dashboard/dnbp-trend-panel";
import { BuyerPerformancePanel } from "@/components/dashboard/buyer-performance-panel";
import { MarginBridgePanel } from "@/components/dashboard/margin-bridge-panel";
import { FulfilmentPanel } from "@/components/dashboard/fulfilment-panel";
import { ExceptionsPanel } from "@/components/dashboard/exceptions-panel";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import {
  analyticsApi,
  type OverviewResponse,
  type OrderBookResponse,
  type DnbpTrendResponse,
  type BuyerPerformanceResponse,
  type MarginBridgeResponse,
  type FulfilmentResponse,
  type ExceptionsResponse,
} from "@/lib/analytics-api";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-AU");

// Seeded species (§6.9) as a sane default set for the DNBP trend selector
// before the order book's own data tells us what's actually active — the
// selector always re-populates from real order-book species once loaded,
// so a new open-registry species appears here with no code change.
const FALLBACK_SPECIES = ["SHEEP", "LAMB", "GOAT", "VEAL", "MUTTON"];

export default function DashboardPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.dashboard.title}>
        <DashboardContent />
      </AppShell>
    </AuthGuard>
  );
}

function DashboardContent() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const [overview, setOverview] = React.useState<OverviewResponse | null>(null);
  const [orderBook, setOrderBook] = React.useState<OrderBookResponse | null>(null);
  const [buyerPerformance, setBuyerPerformance] = React.useState<BuyerPerformanceResponse | null>(null);
  const [marginBridge, setMarginBridge] = React.useState<MarginBridgeResponse | null>(null);
  const [fulfilment, setFulfilment] = React.useState<FulfilmentResponse | null>(null);
  const [exceptions, setExceptions] = React.useState<ExceptionsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [species, setSpecies] = React.useState(FALLBACK_SPECIES[0]);
  const [days, setDays] = React.useState(30);
  const [dnbpTrend, setDnbpTrend] = React.useState<DnbpTrendResponse | null>(null);
  const [trendLoading, setTrendLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    // Loading starts true from useState's initial value (below) — this
    // effect only ever needs to flip it back to false once data lands, not
    // reset it synchronously here (react-hooks/set-state-in-effect: a
    // setState call as the first statement in an effect body causes a
    // cascading extra render).
    Promise.all([
      analyticsApi.getOverview(accessToken),
      analyticsApi.getOrderBook(accessToken),
      analyticsApi.getBuyerPerformance(accessToken),
      analyticsApi.getMarginBridge(accessToken),
      analyticsApi.getFulfilment(accessToken),
      analyticsApi.getBreaches(accessToken),
    ])
      .then(([ov, ob, bp, mb, ff, ex]) => {
        if (cancelled) return;
        setOverview(ov);
        setOrderBook(ob);
        setBuyerPerformance(bp);
        setMarginBridge(mb);
        setFulfilment(ff);
        setExceptions(ex);
        if (ob.by_species.length > 0) setSpecies(ob.by_species[0].species);
      })
      .catch((err) => {
        if (cancelled) return;
        toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "danger" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  React.useEffect(() => {
    let cancelled = false;
    analyticsApi
      .getDnbpTrend(accessToken, species, days)
      .then((data) => {
        if (!cancelled) setDnbpTrend(data);
      })
      .catch((err) => {
        if (cancelled) return;
        toast({ title: err instanceof Error ? err.message : "Something went wrong", variant: "danger" });
      })
      .finally(() => {
        if (!cancelled) setTrendLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, species, days]);

  const availableSpecies = orderBook && orderBook.by_species.length > 0 ? orderBook.by_species.map((r) => r.species) : FALLBACK_SPECIES;

  return (
    <div className="flex flex-col gap-6">
      <div>
        {/* AppShell already renders the page's <h1> (its title bar) — this is the content area's own heading. */}
        <h2 className="text-xl font-semibold text-fg-primary">{strings.dashboard.title}</h2>
        <p className="mt-1 text-sm text-fg-tertiary">{strings.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile
          label={strings.dashboard.kpis.activeExposure}
          value={overview ? money.format(Number(overview.active_exposure_aud)) : "—"}
        />
        <StatTile
          label={strings.dashboard.kpis.headsRequired}
          value={overview ? number.format(Number(overview.heads_required_total)) : "—"}
        />
        <StatTile
          label={strings.dashboard.kpis.headsBought}
          value={overview ? number.format(overview.heads_bought_total) : "—"}
        />
        <StatTile
          label={strings.dashboard.kpis.openCorrections}
          value={overview ? number.format(overview.open_correction_requests) : "—"}
        />
        <StatTile label={strings.dashboard.kpis.breaches} value={overview ? number.format(overview.breach_count) : "—"} />
        <StatTile
          label={strings.dashboard.kpis.blockedLines}
          value={overview ? number.format(overview.blocked_line_count) : "—"}
        />
      </div>

      <OrderBookPanel data={orderBook} loading={loading} />
      <DnbpTrendPanel
        data={dnbpTrend}
        loading={trendLoading}
        species={species}
        availableSpecies={availableSpecies}
        onSpeciesChange={setSpecies}
        days={days}
        onDaysChange={setDays}
      />
      <BuyerPerformancePanel data={buyerPerformance} loading={loading} />
      <MarginBridgePanel data={marginBridge} loading={loading} />
      <FulfilmentPanel data={fulfilment} loading={loading} />
      <ExceptionsPanel data={exceptions} loading={loading} />
    </div>
  );
}
