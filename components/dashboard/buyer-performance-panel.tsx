import { Card } from "@/components/ui/card";
import { BarList } from "@/components/dataviz/bar-list";
import { strings } from "@/lib/strings";
import type { BuyerPerformanceResponse } from "@/lib/analytics-api";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("en-AU", { style: "percent", maximumFractionDigits: 0 });

export function BuyerPerformancePanel({ data, loading }: { data: BuyerPerformanceResponse | null; loading: boolean }) {
  const s = strings.dashboard.panels.buyerPerformance;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-fg-tertiary">Loading…</p>
      ) : !data || data.by_buyer.length === 0 ? (
        <p className="mt-4 text-sm text-fg-tertiary">{strings.dashboard.panels.exceptions.none}</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-secondary">{s.byBuyer}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle text-left text-fg-tertiary">
                  <th className="py-1.5 pr-2 font-medium">Buyer</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Headroom</th>
                  <th className="py-1.5 text-right font-medium">Breach rate</th>
                </tr>
              </thead>
              <tbody>
                {data.by_buyer.map((row) => (
                  <tr key={row.buyer_id} className="border-b border-subtle last:border-0">
                    <td className="py-1.5 pr-2 font-medium text-fg-primary">{row.buyer_email}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                      {money.format(Number(row.headroom_captured_aud))}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-fg-secondary">
                      {pct.format(Number(row.breach_rate))} ({row.breach_count}/{row.entry_count})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-secondary">{s.bySaleyard}</h3>
            <BarList
              rows={data.by_saleyard.map((r) => ({ label: r.saleyard, value: Number(r.headroom_captured_aud) }))}
              valueLabel={s.headroomCaptured}
              formatValue={(v) => money.format(v)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
