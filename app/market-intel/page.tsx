"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarketIntelSummaryPanel } from "@/components/market-intel/summary-panel";
import { MarketIntelObservationsPanel } from "@/components/market-intel/observations-panel";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import { withErrorToast } from "@/lib/with-error-toast";
import { marketIntelApi, type MarketIntelSummaryResponse, type MarketObservationResponse } from "@/lib/market-intel-api";

export default function MarketIntelPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.marketIntel.title}>
        <MarketIntelContent />
      </AppShell>
    </AuthGuard>
  );
}

function MarketIntelContent() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const s = strings.marketIntel;

  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [saleyard, setSaleyard] = React.useState("");
  const [species, setSpecies] = React.useState("");
  const [competitor, setCompetitor] = React.useState("");

  const [summary, setSummary] = React.useState<MarketIntelSummaryResponse | null>(null);
  const [observations, setObservations] = React.useState<MarketObservationResponse[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      await withErrorToast(async () => {
        const filters = { from: from || undefined, to: to || undefined, saleyard: saleyard || undefined, species: species || undefined };
        const [sm, obs] = await Promise.all([
          marketIntelApi.getSummary(accessToken, filters),
          marketIntelApi.listObservations(accessToken, { ...filters, competitorName: competitor || undefined }),
        ]);
        if (cancelled) return;
        setSummary(sm);
        setObservations(obs);
      });
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, from, to, saleyard, species, competitor]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-fg-primary">{s.title}</h2>
        <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="mi-from">{s.filters.from}</Label>
          <Input id="mi-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mi-to">{s.filters.to}</Label>
          <Input id="mi-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mi-saleyard">{s.filters.saleyard}</Label>
          <Input id="mi-saleyard" value={saleyard} onChange={(e) => setSaleyard(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mi-species">{s.filters.species}</Label>
          <Input id="mi-species" value={species} onChange={(e) => setSpecies(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="mi-competitor">{s.filters.competitor}</Label>
          <Input id="mi-competitor" value={competitor} onChange={(e) => setCompetitor(e.target.value)} />
        </div>
      </div>

      <MarketIntelSummaryPanel data={summary} loading={loading} />
      <MarketIntelObservationsPanel data={observations} loading={loading} />
    </div>
  );
}
