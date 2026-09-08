"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CorrectionRequestDialog } from "@/components/workbench/correction-request-dialog";
import { DnbpProofPanel } from "@/components/workbench/dnbp-proof-panel";
import { formatDate, formatMoney, formatText } from "@/components/workbench/format";
import type { OrderLine, OrderWorkings, ValidationIssue } from "@/lib/workbench-api";

// §5.1/§8 Appendix A — the spreadsheet letter behind each received column,
// used only to match a §5.2 cross-check issue (which names the abattoir's
// own column letter) back to the field this grid renders it as.
const LETTER_FOR_FIELD: Record<string, string> = {
  nrv_per_kg: "K",
  pack_cost_ph: "M",
  offal_return_ph: "N",
  skin_return_ph: "O",
  mom_ph: "Q",
  estimated_heads: "U",
  total_livestock_cost: "V",
  dnbp_benchmark: "T",
};

// Engine-raised issues (domain/engine/workings.py) carry no column_ref —
// this is presentation-layer glue only, mapping each code back to the
// field it concerns for the provenance popover.
const CODE_FALLBACK_FIELD: Record<string, string> = {
  MISSING_LIVESTOCK_COST: "expected_livestock_cost_per_kg",
  MISSING_AVG_WEIGHT: "avg_weight_kg",
  MISSING_SELL_PRICE: "avg_price_aud",
  RECEIVED_BENCHMARK_ABSENT: "dnbp_benchmark",
};

function issuesForField(issues: ValidationIssue[], field: string): ValidationIssue[] {
  const letter = LETTER_FOR_FIELD[field];
  return issues.filter(
    (i) => i.column_ref === field || (letter && i.column_ref === letter) || (i.column_ref === null && CODE_FALLBACK_FIELD[i.code] === field)
  );
}

type ReceivedColumn = { key: string; label: string; format: (line: OrderLine) => string };

const RECEIVED_COLUMNS: ReceivedColumn[] = [
  { key: "contract_no", label: "Contract No.", format: (l) => formatText(l.contract_no) },
  { key: "customer_name", label: "Customer", format: (l) => formatText(l.customer_name) },
  { key: "species", label: "Species", format: (l) => formatText(l.species) },
  { key: "loadout_date", label: "Loadout Date", format: (l) => formatDate(l.loadout_date) },
  { key: "qty_kg", label: "Qty (kg)", format: (l) => formatMoney(l.qty_kg, 0) },
  { key: "avg_price_aud", label: "Avg Price AUD", format: (l) => formatMoney(l.avg_price_aud) },
  { key: "amount_aud", label: "Amount AUD", format: (l) => formatMoney(l.amount_aud, 0) },
  { key: "product_type", label: "Product Type", format: (l) => formatText(l.product_type) },
  { key: "incoterm", label: "Incoterm", format: (l) => formatText(l.incoterm) },
  { key: "nrv_per_kg", label: "NRV/kg", format: (l) => formatMoney(l.nrv_per_kg) },
  {
    key: "expected_livestock_cost_per_kg",
    label: "Livestock Cost/kg",
    format: (l) => formatMoney(l.expected_livestock_cost_per_kg),
  },
  { key: "pack_cost_ph", label: "Pack Cost (PH)", format: (l) => formatMoney(l.pack_cost_ph) },
  { key: "offal_return_ph", label: "Offal Return (PH)", format: (l) => formatMoney(l.offal_return_ph) },
  { key: "skin_return_ph", label: "Skin Return (PH)", format: (l) => formatMoney(l.skin_return_ph) },
  { key: "avg_weight_kg", label: "Avg Weight", format: (l) => formatMoney(l.avg_weight_kg, 1) },
  { key: "mom_ph", label: "MoM PH", format: (l) => formatMoney(l.mom_ph) },
  { key: "deposit_received", label: "Deposit", format: (l) => formatMoney(l.deposit_received, 0) },
  { key: "comments", label: "Comments", format: (l) => formatText(l.comments) },
  { key: "dnbp_benchmark", label: "Benchmark DNBP", format: (l) => formatMoney(l.dnbp_benchmark) },
  { key: "estimated_heads", label: "Est. Heads", format: (l) => formatMoney(l.estimated_heads, 1) },
  { key: "total_livestock_cost", label: "Total Cost", format: (l) => formatMoney(l.total_livestock_cost, 0) },
];

type WorkingsColumn = {
  key: keyof OrderWorkings;
  label: string;
  formula: string;
  format: (w: OrderWorkings) => string;
};

const WORKINGS_COLUMNS: WorkingsColumn[] = [
  {
    key: "adjusted_price_per_kg",
    label: "X — Adj. Price/kg",
    formula: "G − cif_buffer (always, CIF and FAS alike)",
    format: (w) => formatMoney(w.adjusted_price_per_kg),
  },
  {
    key: "pack_cost_per_kg",
    label: "Y — Pack Cost/kg",
    formula: "M ÷ standard_weight[species]",
    format: (w) => formatMoney(w.pack_cost_per_kg, 4),
  },
  {
    key: "offal_return_per_kg",
    label: "Z — Offal Return/kg",
    formula: "N ÷ standard_weight[species]",
    format: (w) => formatMoney(w.offal_return_per_kg, 4),
  },
  {
    key: "skin_return_per_kg",
    label: "AA — Skin Return/kg",
    formula: "O ÷ standard_weight[species]",
    format: (w) => formatMoney(w.skin_return_per_kg, 4),
  },
  {
    key: "profit_on_peter_costs",
    label: "AB — Profit on Peter Costs",
    formula: "X − L − Y + Z + AA",
    format: (w) => formatMoney(w.profit_on_peter_costs),
  },
  {
    key: "profit_on_bing_dnbp",
    label: "AD — Profit on Bing DNBP",
    formula: "X − AC − Y + Z + AA",
    format: (w) => formatMoney(w.profit_on_bing_dnbp),
  },
  {
    key: "diff_vs_benchmark",
    label: "AE — Diff vs Benchmark",
    formula: "AC − dnbp_benchmark",
    format: (w) => formatMoney(w.diff_vs_benchmark),
  },
  {
    key: "diff_vs_peter",
    label: "AF — Diff vs Peter",
    formula: "AC − expected_livestock_cost_per_kg",
    format: (w) => formatMoney(w.diff_vs_peter),
  },
];

function RowStatusIcon({ issues, hasCorrectionOpen }: { issues: ValidationIssue[]; hasCorrectionOpen: boolean }) {
  if (issues.some((i) => i.severity === "BLOCK")) return <span title="Blocked">⛔</span>;
  if (hasCorrectionOpen) return <span title="Correction requested">✉</span>;
  if (issues.some((i) => i.severity === "WARN" || i.severity === "CORRECTION")) return <span title="Warning">⚠</span>;
  return <span title="Ready">✓</span>;
}

function ReceivedCell({
  line,
  column,
  issues,
  onRequestCorrection,
}: {
  line: OrderLine;
  column: ReceivedColumn;
  issues: ValidationIssue[];
  onRequestCorrection: (columnRef: string, issueCode: string) => void;
}) {
  const source = line.value_sources[column.key];
  const relatedIssues = issuesForField(issues, column.key);
  const value = column.format(line);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-numeric
          className="block w-full truncate px-3 py-2 text-left text-sm text-fg-primary hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {value}
          {source === "HAND_SET" ? <span className="ml-1 text-status-close-fg">•</span> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-semibold text-fg-primary">{column.label}</p>
        <p className="mt-1 text-fg-secondary">Abattoir data — request a correction to change this.</p>
        {source ? (
          <p className="mt-2">
            <Badge variant={source === "HAND_SET" ? "close" : "neutral"}>{source}</Badge>
          </p>
        ) : null}
        {relatedIssues.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {relatedIssues.map((issue) => (
              <li key={issue.id} className="text-status-close-fg">
                {issue.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-fg-tertiary">No cross-check discrepancy detected.</p>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => onRequestCorrection(column.key, relatedIssues[0]?.code ?? "MANUAL_FLAG")}
        >
          Request correction
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function ComputedCell({
  workings,
  column,
  refDataVersion,
  isAnchor,
}: {
  workings: OrderWorkings;
  column: WorkingsColumn;
  refDataVersion: string;
  isAnchor?: boolean;
}) {
  const value = column.format(workings);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-numeric
          className={
            isAnchor
              ? "block w-full truncate px-3 py-2 text-right text-lg font-bold text-accent-default hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              : "block w-full truncate px-3 py-2 text-right text-sm text-fg-primary hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          }
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-semibold text-fg-primary">{column.label}</p>
        <p className="mt-1 tabular-nums text-fg-secondary">{column.formula}</p>
        <dl className="mt-2 space-y-1">
          <div className="flex justify-between">
            <dt className="text-fg-tertiary">Result</dt>
            <dd className="tabular-nums text-fg-primary">{value}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-tertiary">Engine version</dt>
            <dd className="text-fg-primary">{workings.engine_version}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-fg-tertiary">Reference data</dt>
            <dd className="text-fg-primary">{refDataVersion}</dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}

export function OrderWorkbenchGrid({
  lines,
  workingsByLineId,
  issuesByLineId,
  openCorrectionColumnsByLineId,
  onCorrectionRaised,
}: {
  lines: OrderLine[];
  workingsByLineId: Map<string, OrderWorkings>;
  issuesByLineId: Map<string, ValidationIssue[]>;
  openCorrectionColumnsByLineId: Map<string, Set<string>>;
  onCorrectionRaised: () => void;
}) {
  const [proofLineId, setProofLineId] = React.useState<string | null>(null);
  const [correctionTarget, setCorrectionTarget] = React.useState<{ lineId: string; columnRef: string; issueCode: string } | null>(
    null
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-default">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-b border-default bg-surface px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-fg-tertiary">
              Status
            </th>
            <th
              colSpan={RECEIVED_COLUMNS.length}
              className="border-b border-default bg-sunken px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-tertiary"
            >
              🔒 Received · A–V — abattoir data, read-only
            </th>
            <th
              colSpan={WORKINGS_COLUMNS.length}
              className="border-b border-l-4 border-l-strong border-default bg-surface px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-fg-tertiary"
            >
              Workings · X–AF — Everhealth computed
            </th>
            <th className="sticky right-0 z-10 border-b border-default bg-surface px-3 py-1.5 text-right text-xs font-semibold uppercase tracking-wide text-accent-default">
              AC — Bing DNBP
            </th>
          </tr>
          <tr>
            <th className="sticky left-0 z-10 border-b border-default bg-surface px-2 py-1">
              <span className="sr-only">Status</span>
            </th>
            {RECEIVED_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap border-b border-default bg-sunken px-3 py-1.5 text-left text-xs font-medium text-fg-secondary"
              >
                {col.label}
              </th>
            ))}
            {WORKINGS_COLUMNS.map((col) => (
              <th
                key={col.key}
                className="whitespace-nowrap border-b border-default bg-surface px-3 py-1.5 text-right text-xs font-medium text-fg-secondary"
              >
                {col.label}
              </th>
            ))}
            <th className="sticky right-0 z-10 border-b border-default bg-surface px-3 py-1.5">
              <span className="sr-only">AC — Bing DNBP</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const workings = workingsByLineId.get(line.id);
            const issues = issuesByLineId.get(line.id) ?? [];
            const openColumns = openCorrectionColumnsByLineId.get(line.id) ?? new Set<string>();

            return (
              <tr key={line.id} className="odd:bg-surface even:bg-canvas">
                <td className="sticky left-0 z-10 border-b border-subtle bg-inherit px-2 py-1 text-center">
                  <RowStatusIcon issues={issues} hasCorrectionOpen={openColumns.size > 0} />
                </td>
                {RECEIVED_COLUMNS.map((col) => (
                  <td key={col.key} className="border-b border-subtle bg-sunken p-0">
                    <ReceivedCell
                      line={line}
                      column={col}
                      issues={issues}
                      onRequestCorrection={(columnRef, issueCode) => setCorrectionTarget({ lineId: line.id, columnRef, issueCode })}
                    />
                  </td>
                ))}
                {WORKINGS_COLUMNS.map((col) =>
                  workings ? (
                    <td key={col.key} className="border-b border-subtle p-0">
                      <ComputedCell workings={workings} column={col} refDataVersion={workings.ref_data_version} />
                    </td>
                  ) : (
                    <td key={col.key} className="border-b border-subtle px-3 py-2 text-right text-fg-tertiary">
                      —
                    </td>
                  )
                )}
                <td className="sticky right-0 z-10 border-b border-subtle bg-surface p-0">
                  {workings ? (
                    <div className="flex items-center justify-end gap-2 px-3 py-2">
                      <ComputedCell
                        workings={workings}
                        column={{
                          key: "bing_dnbp",
                          label: "AC — Bing Do Not Buy Price ★",
                          formula: "(G − cif_buffer) × dnbp_factor[species]",
                          format: (w) => formatMoney(w.bing_dnbp),
                        }}
                        refDataVersion={workings.ref_data_version}
                        isAnchor
                      />
                      <Button variant="ghost" size="sm" onClick={() => setProofLineId(line.id)} title="View DNBP proof">
                        proof
                      </Button>
                    </div>
                  ) : (
                    <span className="block px-3 py-2 text-right text-fg-tertiary">not computed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <DnbpProofPanel
        key={proofLineId}
        orderLineId={proofLineId}
        open={proofLineId !== null}
        onOpenChange={(open) => !open && setProofLineId(null)}
      />

      {correctionTarget ? (
        <CorrectionRequestDialog
          orderLineId={correctionTarget.lineId}
          columnRef={correctionTarget.columnRef}
          issueCode={correctionTarget.issueCode}
          open={correctionTarget !== null}
          onOpenChange={(open) => !open && setCorrectionTarget(null)}
          onRaised={onCorrectionRaised}
        />
      ) : null}
    </div>
  );
}
