"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { ApiError } from "@/lib/api-client";
import { referenceDataApi, type ProductTypeRow, type SpeciesRow } from "@/lib/reference-data-api";
import { strings } from "@/lib/strings";

function AddRow({
  onAdd,
  placeholder,
}: {
  onAdd: (code: string, displayName: string) => Promise<void>;
  placeholder: string;
}) {
  const [code, setCode] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !displayName.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(code, displayName);
      setCode("");
      setDisplayName("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-tertiary">{strings.referenceData.registries.code}</label>
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={placeholder} className="w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-fg-tertiary">{strings.referenceData.registries.displayName}</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-48" />
      </div>
      <Button type="submit" size="sm" disabled={submitting}>
        Add
      </Button>
    </form>
  );
}

export function RegistriesPanel() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [species, setSpecies] = React.useState<SpeciesRow[]>([]);
  const [productTypes, setProductTypes] = React.useState<ProductTypeRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const [speciesRows, productTypeRows] = await Promise.all([
        referenceDataApi.listSpecies(accessToken),
        referenceDataApi.listProductTypes(accessToken),
      ]);
      setSpecies(speciesRows);
      setProductTypes(productTypeRows);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleAddSpecies(code: string, displayName: string) {
    try {
      await referenceDataApi.createSpecies({ code, display_name: displayName }, accessToken);
      await load();
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : "Could not add species", variant: "danger" });
    }
  }

  async function handleAddProductType(code: string, displayName: string) {
    try {
      await referenceDataApi.createProductType({ code, display_name: displayName }, accessToken);
      await load();
    } catch (err) {
      toast({ title: err instanceof ApiError ? err.message : "Could not add product type", variant: "danger" });
    }
  }

  if (loading) return <p className="text-sm text-fg-tertiary">Loading…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <p className="text-sm font-semibold text-fg-primary">{strings.referenceData.registries.speciesTitle}</p>
        <div className="mt-3 flex flex-col gap-2">
          {species.map((s) => (
            <div key={s.code} className="flex items-center justify-between text-sm">
              <span>
                {s.display_name} <span className="text-fg-tertiary">({s.code})</span>
              </span>
              <Badge variant={s.has_dnbp_factor ? "pass" : "close"}>
                {s.has_dnbp_factor ? strings.referenceData.registries.readyToPrice : strings.referenceData.registries.missingFactor}
              </Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-subtle pt-4">
          <AddRow onAdd={handleAddSpecies} placeholder="HOGGET" />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-fg-primary">{strings.referenceData.registries.productTypeTitle}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {productTypes.map((pt) => (
            <Badge key={pt.code} variant="neutral">
              {pt.display_name}
            </Badge>
          ))}
        </div>
        <div className="mt-4 border-t border-subtle pt-4">
          <AddRow onAdd={handleAddProductType} placeholder="BONELESS" />
        </div>
      </Card>
    </div>
  );
}
