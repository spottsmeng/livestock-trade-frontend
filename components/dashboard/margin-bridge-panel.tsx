import { Card } from "@/components/ui/card";
import { BridgeChart, type BridgeStep } from "@/components/dataviz/bridge-chart";
import { strings } from "@/lib/strings";
import type { MarginBridgeResponse } from "@/lib/analytics-api";

const perKg = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 4 });

function fmt(value: string | null): string {
  return value === null ? "—" : perKg.format(Number(value));
}

export function MarginBridgePanel({ data, loading }: { data: MarginBridgeResponse | null; loading: boolean }) {
  const s = strings.dashboard.panels.marginBridge;

  const heroSteps: BridgeStep[] = [
    { label: "Sell price (G)", value: fmt(data?.avg_sell_price_aud ?? null) },
    { label: "Adjusted price (X)", value: fmt(data?.avg_adjusted_price_per_kg ?? null) },
    { label: "Bing DNBP (AC)", value: fmt(data?.avg_bing_dnbp ?? null), hero: true },
  ];
  const supportingSteps: BridgeStep[] = [
    { label: "Pack cost (Y)", value: fmt(data?.avg_pack_cost_per_kg ?? null) },
    { label: "Offal return (Z)", value: fmt(data?.avg_offal_return_per_kg ?? null) },
    { label: "Skin return (AA)", value: fmt(data?.avg_skin_return_per_kg ?? null) },
    { label: "Profit on Peter's costs (AB)", value: fmt(data?.avg_profit_on_peter_costs ?? null) },
  ];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-fg-tertiary">Loading…</p>
      ) : !data || data.line_count === 0 ? (
        <p className="mt-4 text-sm text-fg-tertiary">{strings.dashboard.panels.exceptions.none}</p>
      ) : (
        <div className="mt-4">
          <BridgeChart heroSteps={heroSteps} supportingSteps={supportingSteps} />
          <p className="mt-4 text-xs text-fg-tertiary">Averaged across {data.line_count} active line(s).</p>
        </div>
      )}
    </Card>
  );
}
