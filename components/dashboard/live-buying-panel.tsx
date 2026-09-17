import { Card } from "@/components/ui/card";
import { strings } from "@/lib/strings";
import type { SpeciesProgress } from "@/lib/publications-api";

const number = new Intl.NumberFormat("en-AU");

export function LiveBuyingPanel({ data, loading }: { data: SpeciesProgress | null; loading: boolean }) {
  const s = strings.dashboard.panels.liveBuying;

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{s.title}</h2>
      <p className="mt-1 text-sm text-fg-tertiary">{s.subtitle}</p>

      {loading ? (
        <p className="mt-4 text-sm text-fg-tertiary">Loading…</p>
      ) : !data || data.species.length === 0 ? (
        <p className="mt-4 text-sm text-fg-tertiary">{s.none}</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="border-b border-subtle text-left text-fg-tertiary">
              <th className="py-1.5 pr-2 font-medium">Species</th>
              <th className="py-1.5 pr-2 text-right font-medium">{s.target}</th>
              <th className="py-1.5 pr-2 text-right font-medium">{s.boughtSoFar}</th>
              <th className="py-1.5 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.species.map((row) => {
              const target = row.target_heads !== null ? Number(row.target_heads) : null;
              const pct = target && target > 0 ? Math.min(100, (row.heads_bought / target) * 100) : 0;
              return (
                <tr key={row.species} className="border-b border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-fg-primary">{row.species}</td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                    {target !== null ? number.format(target) : "—"}
                  </td>
                  <td className="py-1.5 pr-2 text-right tabular-nums text-fg-secondary">
                    {number.format(row.heads_bought)}
                  </td>
                  <td className="py-1.5">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-sunken">
                      <div className="h-full rounded-full bg-accent-default" style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
