"use client";

import * as React from "react";
import Decimal from "decimal.js";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { BuyerBottomNav } from "@/components/buyer/bottom-nav";
import { BreachReasonChips } from "@/components/buyer/breach-reason-chips";
import { StatusBadge } from "@/components/buyer/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import { scoreBid } from "@/lib/buyer/bidcheck";
import { getCachedDnbp, type CachedDnbp } from "@/lib/buyer/db";
import { submitBuyEntry } from "@/lib/buyer/create-entry";

// §12.3 — mirrors the seed config's bid_check_close_threshold_pct (5).
// Not fetched from the API this phase: Bid Check must work fully offline
// from a cold start, and this constant changes rarely enough that shipping
// it as a client-side default (rather than adding a public config
// endpoint just for one number) is a reasonable, named simplification.
const CLOSE_THRESHOLD_PCT = 5;

export default function BidCheckPage() {
  return (
    <AuthGuard requiredRole="BUYER">
      <AppShell title={strings.buyer.bidCheck.title}>
        <BidCheckContent />
      </AppShell>
      <BuyerBottomNav />
    </AuthGuard>
  );
}

function BidCheckContent() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [cached, setCached] = React.useState<CachedDnbp | null>(null);
  const [species, setSpecies] = React.useState<string>("");
  const [pricePerHead, setPricePerHead] = React.useState("");
  const [weightKg, setWeightKg] = React.useState("");
  const [showLogFields, setShowLogFields] = React.useState(false);
  const [agent, setAgent] = React.useState("");
  const [pen, setPen] = React.useState("");
  const [heads, setHeads] = React.useState("1");
  const [breachReason, setBreachReason] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const lastVibratedStatusRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    void (async () => {
      const data = await getCachedDnbp();
      setCached(data ?? null);
      if (data && data.species.length > 0) setSpecies(data.species[0].species);
    })();
  }, []);

  const speciesLine = cached?.species.find((s) => s.species === species);
  const result =
    speciesLine && pricePerHead && weightKg
      ? scoreBid({
          pricePerHead,
          weightKg,
          dnbpPerKg: speciesLine.dnbp_per_kg,
          closeThresholdPct: CLOSE_THRESHOLD_PCT,
        })
      : null;

  React.useEffect(() => {
    if (result && result.status !== lastVibratedStatusRef.current) {
      lastVibratedStatusRef.current = result.status;
      // §12.3 — haptic feedback on state transition; the buyer may not be looking at the screen.
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(result.status === "BREACH" ? [80, 40, 80] : 40);
      }
    }
  }, [result]);

  if (!cached || cached.species.length === 0) {
    return <EmptyState title={strings.buyer.dnbpHome.noPublication} />;
  }

  async function handleLog() {
    if (!result || !speciesLine) return;
    if (result.isBreach && !breachReason) {
      toast({ title: strings.buyer.buyLog.breachReasonLabel, variant: "danger" });
      return;
    }
    setSaving(true);
    try {
      await submitBuyEntry(
        {
          saleyard: "Bendigo",
          trade_date: new Date().toISOString().slice(0, 10),
          species,
          agent: agent || null,
          pen: pen || null,
          head_count: Number(heads) || 1,
          price_per_head: pricePerHead,
          weight_kg: weightKg,
          breach_reason: result.isBreach ? breachReason : null,
        },
        accessToken
      );
      toast({ title: "Buy logged" });
      setShowLogFields(false);
      setAgent("");
      setPen("");
      setBreachReason(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex flex-col gap-1">
        <Label htmlFor="species">{strings.buyer.bidCheck.speciesLabel}</Label>
        <select
          id="species"
          value={species}
          onChange={(e) => setSpecies(e.target.value)}
          className="h-14 rounded-md border border-default bg-surface px-3 text-lg"
        >
          {cached.species.map((s) => (
            <option key={s.species} value={s.species}>
              {s.species}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="price-per-head">{strings.buyer.bidCheck.pricePerHeadLabel}</Label>
        <Input
          id="price-per-head"
          inputMode="decimal"
          type="number"
          className="h-16 text-2xl"
          value={pricePerHead}
          onChange={(e) => setPricePerHead(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="weight">{strings.buyer.bidCheck.weightLabel}</Label>
        <Input
          id="weight"
          inputMode="decimal"
          type="number"
          className="h-16 text-2xl"
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
        />
      </div>

      {result ? (
        <div className="mt-2 flex flex-col items-center gap-3 rounded-lg border border-subtle bg-sunken p-6 text-center">
          <p data-numeric className="text-4xl font-bold text-fg-primary">
            ${result.impliedPricePerKg.toFixed(2)} {strings.buyer.bidCheck.resultSuffix}
          </p>
          <StatusBadge status={result.status} className="text-base" />
          <p className="text-sm text-fg-secondary">
            {result.isBreach
              ? `$${result.variancePerKg.abs().toFixed(2)}/kg ${strings.buyer.bidCheck.overDnbp}`
              : `$${result.variancePerKg.toFixed(2)}/kg ${strings.buyer.bidCheck.headroom}`}
            {" · "}
            {strings.buyer.bidCheck.dnbpIs} ${new Decimal(speciesLine!.dnbp_per_kg).toFixed(2)}
          </p>
          <p data-numeric className="text-lg font-semibold text-accent-default">
            {strings.buyer.bidCheck.maxPricePrefix} {weightKg}kg: ${result.maxPricePerHead.toFixed(2)}
          </p>
        </div>
      ) : null}

      {result ? (
        <div className="flex flex-col gap-3 border-t border-subtle pt-4">
          {!showLogFields ? (
            <Button size="lg" variant={result.isBreach ? "danger" : "primary"} onClick={() => setShowLogFields(true)}>
              {result.isBreach ? strings.buyer.bidCheck.logAnyway : strings.buyer.bidCheck.logThisBuy}
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="agent">{strings.buyer.buyLog.agentLabel}</Label>
                  <Input id="agent" value={agent} onChange={(e) => setAgent(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="pen">{strings.buyer.buyLog.penLabel}</Label>
                  <Input id="pen" value={pen} onChange={(e) => setPen(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="heads">{strings.buyer.buyLog.headsLabel}</Label>
                  <Input id="heads" inputMode="numeric" type="number" value={heads} onChange={(e) => setHeads(e.target.value)} />
                </div>
              </div>
              {result.isBreach ? <BreachReasonChips value={breachReason} onChange={setBreachReason} /> : null}
              <Button size="lg" onClick={handleLog} disabled={saving}>
                {saving ? strings.buyer.buyLog.saving : strings.buyer.buyLog.save}
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
