import { Card } from "@/components/ui/card";
import { DualLineChart } from "@/components/dataviz/dual-line-chart";
import { strings } from "@/lib/strings";
import type { DnbpTrendResponse } from "@/lib/analytics-api";

const perKg = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 });

export function DnbpTrendPanel({
  data,
  loading,
  species,
  availableSpecies,
  onSpeciesChange,
  days,
  onDaysChange,
}: {
  data: DnbpTrendResponse | null;
  loading: boolean;
  species: string;
  availableSpecies: string[];
  onSpeciesChange: (species: string) => void;
  days: number;
  onDaysChange: (days: number) => void;
}) {
  const s = strings.dashboard.panels.dnbpTrend;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
          <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-1.5">
            <span className="text-fg-tertiary">{s.speciesLabel}</span>
            <select
              value={species}
              onChange={(e) => onSpeciesChange(e.target.value)}
              className="h-9 rounded-md border border-default bg-surface px-2 text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {availableSpecies.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-fg-tertiary">{s.daysLabel}</span>
            <select
              value={days}
              onChange={(e) => onDaysChange(Number(e.target.value))}
              className="h-9 rounded-md border border-default bg-surface px-2 text-fg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {[7, 14, 30, 90].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-fg-tertiary">Loading…</p>
        ) : (
          <DualLineChart
            heroLabel={s.heroLabel}
            hero={(data?.dnbp_points ?? []).map((p) => ({ x: p.published_at.slice(0, 10), y: Number(p.dnbp_per_kg) }))}
            referenceLabel={s.referenceLabel}
            reference={(data?.actual_paid_points ?? []).map((p) => ({ x: p.trade_date, y: Number(p.avg_paid_per_kg) }))}
            formatValue={(v) => perKg.format(v)}
          />
        )}
      </div>
    </Card>
  );
}
