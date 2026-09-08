import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { BarList } from "@/components/dataviz/bar-list";
import { strings } from "@/lib/strings";
import type { OrderBookResponse } from "@/lib/analytics-api";

const money = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-AU");

export function OrderBookPanel({ data, loading }: { data: OrderBookResponse | null; loading: boolean }) {
  const s = strings.dashboard.panels.orderBook;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-fg-tertiary">Loading…</p>
      ) : !data || data.by_species.length === 0 ? (
        <p className="mt-4 text-sm text-fg-tertiary">{strings.dashboard.panels.exceptions.none}</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-secondary">{s.exposureBySpecies}</h3>
            <BarList
              rows={data.by_species.map((r) => ({ label: r.species, value: Number(r.exposure_aud) }))}
              valueLabel={s.exposureBySpecies}
              formatValue={(v) => money.format(v)}
            />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-fg-secondary">{s.headsRequiredVsBought}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle text-left text-fg-tertiary">
                  <th className="py-1.5 pr-2 font-medium">Species</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Required</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Bought</th>
                  <th className="py-1.5 text-right font-medium">{s.daysOfCover}</th>
                </tr>
              </thead>
              <tbody>
                {data.by_species.map((row) => (
                  <tr key={row.species} className="border-b border-subtle last:border-0">
                    <td className="py-1.5 pr-2 font-medium text-fg-primary">{row.species}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                      {number.format(Number(row.heads_required))}
                    </td>
                    <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                      {number.format(row.heads_bought)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-fg-secondary">
                      {row.days_of_cover === null ? "—" : number.format(Math.round(Number(row.days_of_cover)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-fg-tertiary">{s.daysOfCoverHint}</p>
          </div>
        </div>
      )}

      {data ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label={s.totalExposure} value={money.format(Number(data.total_exposure_aud))} />
          <StatTile
            label={strings.dashboard.kpis.headsRequired}
            value={number.format(data.by_species.reduce((sum, r) => sum + Number(r.heads_required), 0))}
          />
          <StatTile
            label={strings.dashboard.kpis.headsBought}
            value={number.format(data.by_species.reduce((sum, r) => sum + r.heads_bought, 0))}
          />
        </div>
      ) : null}
    </Card>
  );
}
