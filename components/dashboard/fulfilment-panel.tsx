import { Card } from "@/components/ui/card";
import { GroupedBarChart } from "@/components/dataviz/grouped-bar-chart";
import { strings } from "@/lib/strings";
import type { FulfilmentResponse } from "@/lib/analytics-api";

const kg = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

export function FulfilmentPanel({ data, loading }: { data: FulfilmentResponse | null; loading: boolean }) {
  const s = strings.dashboard.panels.fulfilment;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-fg-tertiary">Loading…</p>
        ) : (
          <GroupedBarChart
            rows={(data?.rows ?? []).map((r) => ({
              label: r.trade_date,
              a: Number(r.instructed_schw_kg),
              b: Number(r.bought_schw_kg),
            }))}
            labelA={s.instructed}
            labelB={s.bought}
            formatValue={(v) => `${kg.format(v)} kg`}
          />
        )}
      </div>
    </Card>
  );
}
