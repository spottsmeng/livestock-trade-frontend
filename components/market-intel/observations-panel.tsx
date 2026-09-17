import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { strings } from "@/lib/strings";
import type { MarketObservationResponse } from "@/lib/market-intel-api";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });

export function MarketIntelObservationsPanel({ data, loading }: { data: MarketObservationResponse[] | null; loading: boolean }) {
  const s = strings.marketIntel.observations;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-fg-tertiary">Loading…</p>
      ) : !data || data.length === 0 ? (
        <p className="mt-4 text-sm text-fg-tertiary">{s.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-left text-fg-tertiary">
                <th className="py-1.5 pr-2 font-medium">{s.columns.date}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.saleyard}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.species}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.competitor}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.agent}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.pen}</th>
                <th className="py-1.5 pr-2 text-right font-medium">{s.columns.heads}</th>
                <th className="py-1.5 pr-2 text-right font-medium">{s.columns.pricePerHead}</th>
                <th className="py-1.5 pr-2 text-right font-medium">{s.columns.pricePerKg}</th>
                <th className="py-1.5 pr-2 font-medium">{s.columns.estimated}</th>
                <th className="py-1.5 font-medium">{s.columns.observer}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b border-subtle last:border-0">
                  <td className="py-1.5 pr-2 text-fg-secondary">{row.trade_date}</td>
                  <td className="py-1.5 pr-2 text-fg-secondary">{row.saleyard}</td>
                  <td className="py-1.5 pr-2 text-fg-secondary">{row.species}</td>
                  <td className="py-1.5 pr-2 font-medium text-fg-primary">{row.competitor_name}</td>
                  <td className="py-1.5 pr-2 text-fg-secondary">{row.agent ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-fg-secondary">{row.pen ?? "—"}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">{row.head_count}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                    {money.format(Number(row.price_per_head))}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                    {row.implied_price_per_kg ? money.format(Number(row.implied_price_per_kg)) : "—"}
                  </td>
                  <td className="py-1.5 pr-2">{row.is_estimated ? <Badge variant="neutral">Est.</Badge> : null}</td>
                  <td className="py-1.5 text-fg-secondary">{row.observer_email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
