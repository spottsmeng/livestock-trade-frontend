"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import { referenceDataApi, type AbattoirTables, type DriftRow } from "@/lib/reference-data-api";
import { strings } from "@/lib/strings";

function TableCard({ title, values }: { title: string; values: Record<string, string> }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-fg-tertiary">{title}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {Object.entries(values).map(([key, value]) => (
          <Badge key={key} variant="neutral">
            {key}: {Number(value).toFixed(2)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function AbattoirPanel() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tables, setTables] = React.useState<AbattoirTables | null>(null);
  const [drift, setDrift] = React.useState<DriftRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [acking, setAcking] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [driftRows, tableData] = await Promise.all([
        referenceDataApi.listDrift(accessToken, true),
        referenceDataApi.getAbattoirTables(accessToken).catch(() => null),
      ]);
      setDrift(driftRows);
      setTables(tableData);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleAcknowledge(id: string) {
    setAcking(id);
    try {
      await referenceDataApi.acknowledgeDrift(id, accessToken);
      await load();
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : "Could not acknowledge", variant: "danger" });
    } finally {
      setAcking(null);
    }
  }

  if (loading) return <p className="text-sm text-fg-tertiary">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold text-fg-primary">{strings.referenceData.abattoir.title}</p>
        <p className="text-sm text-fg-secondary">{strings.referenceData.abattoir.subtitle}</p>
        {tables ? (
          <div className="mt-4 flex flex-col gap-4">
            <TableCard title="Pack cost by product type" values={tables.pack_cost_by_product_type} />
            <TableCard title="Offal return per head by species" values={tables.offal_return_ph_by_species} />
            <TableCard title="Skin return per head by species" values={tables.skin_return_ph_by_species} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-fg-tertiary">No submission ingested yet.</p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-semibold text-fg-primary">{strings.referenceData.abattoir.drift}</p>
        {drift.length === 0 ? (
          <p className="mt-2 text-sm text-fg-tertiary">{strings.referenceData.abattoir.noDrift}</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {drift.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-subtle px-3 py-2 text-sm"
              >
                <span>
                  <strong>{row.table_key}</strong> [{row.key1}]: {row.old_value ?? "—"} → {row.new_value ?? "—"}
                </span>
                <Button size="sm" variant="secondary" disabled={acking === row.id} onClick={() => handleAcknowledge(row.id)}>
                  {strings.referenceData.abattoir.acknowledge}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
