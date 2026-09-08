"use client";

import * as React from "react";
import { use } from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import {
  buyInstructionsApi,
  type BuyInstruction,
  type BuyInstructionLine,
  type Reconciliation,
} from "@/lib/buy-instructions-api";

function money(value: string, dp = 2) {
  return Number(value).toFixed(dp);
}

export default function BuyInstructionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.buyInstructions.title}>
        <BuyInstructionDetailContent id={id} />
      </AppShell>
    </AuthGuard>
  );
}

function BuyInstructionDetailContent({ id }: { id: string }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const [instruction, setInstruction] = React.useState<BuyInstruction | null>(null);
  const [reconciliation, setReconciliation] = React.useState<Reconciliation | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [fillDrafts, setFillDrafts] = React.useState<Record<string, { label: string; amount: string }>>({});

  const load = React.useCallback(async () => {
    try {
      const [inst, recon] = await Promise.all([
        buyInstructionsApi.get(id, accessToken),
        buyInstructionsApi.getReconciliation(id, accessToken).catch(() => null),
      ]);
      setInstruction(inst);
      setReconciliation(recon);
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function withBusy(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Something went wrong", variant: "danger" });
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    await withBusy("approve", async () => {
      await buyInstructionsApi.approve(id, accessToken);
      await load();
    });
  }

  async function handleIssue() {
    await withBusy("issue", async () => {
      await buyInstructionsApi.issue(id, accessToken);
      await load();
    });
  }

  async function handleReconcileClose() {
    await withBusy("reconcile-close", async () => {
      await buyInstructionsApi.reconcileClose(id, accessToken);
      await load();
    });
  }

  async function handleAddFill(line: BuyInstructionLine) {
    const draft = fillDrafts[line.id];
    if (!draft?.label || !draft?.amount) return;
    await withBusy(`fill-${line.id}`, async () => {
      const updated = await buyInstructionsApi.addFill(id, line.id, draft.label, draft.amount, accessToken);
      setInstruction(updated);
      setFillDrafts((prev) => ({ ...prev, [line.id]: { label: "", amount: "" } }));
    });
  }

  async function handleRemoveFill(line: BuyInstructionLine, fillId: string) {
    await withBusy(`fill-${line.id}`, async () => {
      const updated = await buyInstructionsApi.removeFill(id, line.id, fillId, accessToken);
      setInstruction(updated);
    });
  }

  async function handleExport(format: "pdf" | "xlsx") {
    await withBusy(`export-${format}`, async () => {
      const blob = await buyInstructionsApi.downloadExport(id, format, accessToken);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${instruction?.instruction_no ?? "buy-instruction"}-v${instruction?.version ?? 1}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (loading && !instruction) {
    return <p className="text-sm text-fg-tertiary">Loading…</p>;
  }
  if (!instruction) {
    return <EmptyState title="Buy Instruction not found" />;
  }

  const canFill = instruction.status === "ISSUED" || instruction.status === "ACKNOWLEDGED";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* AppShell already renders the page's <h1> (its title bar) — this is the content area's own heading. */}
          <h2 className="text-xl font-semibold text-fg-primary">
            {instruction.instruction_no} <span className="text-fg-tertiary">v{instruction.version}</span>
          </h2>
          <p className="mt-1 text-sm text-fg-secondary">
            {instruction.trade_date} · {instruction.approved_by ? `${strings.buyInstructions.approvedBy}: ✓` : "Not yet approved"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={instruction.status === "RECONCILED" ? "pass" : "accent"}>{instruction.status}</Badge>
          {instruction.status === "DRAFT" && role === "OWNER" && !instruction.approved_by ? (
            <Button size="sm" onClick={handleApprove} disabled={busy === "approve"}>
              {busy === "approve" ? strings.buyInstructions.approving : strings.buyInstructions.approve}
            </Button>
          ) : null}
          {instruction.status === "DRAFT" && instruction.approved_by ? (
            <Button size="sm" onClick={handleIssue} disabled={busy === "issue"}>
              {busy === "issue" ? strings.buyInstructions.issuing : strings.buyInstructions.issue}
            </Button>
          ) : null}
          {instruction.status === "ACKNOWLEDGED" ? (
            <Button size="sm" variant="secondary" onClick={handleReconcileClose} disabled={busy === "reconcile-close"}>
              {busy === "reconcile-close" ? strings.buyInstructions.closing : strings.buyInstructions.reconcileClose}
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" onClick={() => handleExport("xlsx")} disabled={busy === "export-xlsx"}>
            {busy === "export-xlsx" ? strings.buyInstructions.export.exporting : strings.buyInstructions.export.xlsx}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleExport("pdf")} disabled={busy === "export-pdf"}>
            {busy === "export-pdf" ? strings.buyInstructions.export.exporting : strings.buyInstructions.export.pdf}
          </Button>
        </div>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-fg-primary">{strings.buyInstructions.lineItems}</h2>
        <div className="mt-3 overflow-x-auto">
          {/* eslint-disable-next-line local/no-raw-design-values -- 900px is the minimum width this
              specific wide table needs before its columns start clipping; not a design-token value,
              a functional layout threshold, and the closest named scale step (min-w-96 = 384px) isn't
              remotely equivalent. */}
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-subtle text-left text-fg-tertiary">
                <th className="py-2 pr-3">{strings.buyInstructions.columns.contract}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.columns.schw}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.columns.expectedHeads}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.columns.weightRequirement}</th>
                <th className="py-2 pr-3 text-right font-semibold text-fg-primary">{strings.buyInstructions.columns.dnbp}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.columns.petersExpectation}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.columns.expectedCost}</th>
                <th className="py-2 pr-3">{strings.buyInstructions.columns.fills}</th>
                <th className="py-2 text-right">{strings.buyInstructions.columns.balance}</th>
              </tr>
            </thead>
            <tbody>
              {instruction.lines.map((line) => (
                <tr key={line.id} className="border-b border-subtle align-top">
                  <td className="py-2 pr-3 font-medium">{line.contract_no ?? "—"}</td>
                  <td className="py-2 pr-3 text-right" data-numeric>{money(line.schw_kg)}</td>
                  <td className="py-2 pr-3 text-right" data-numeric>{money(line.expected_heads)}</td>
                  <td className="py-2 pr-3 text-right" data-numeric>{money(line.weight_requirement_kg)}</td>
                  <td className="py-2 pr-3 text-right font-semibold text-accent-default" data-numeric>
                    ${money(line.dnbp_per_kg, 4)}
                  </td>
                  <td className="py-2 pr-3 text-right text-fg-tertiary" data-numeric>
                    {line.peters_expectation ? money(line.peters_expectation, 4) : "—"}
                  </td>
                  <td className="py-2 pr-3 text-right" data-numeric>{money(line.expected_livestock_cost)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-col gap-1">
                      {line.fills.map((fill) => (
                        <div key={fill.id} className="flex items-center gap-2 text-xs">
                          <span className="text-fg-secondary">
                            {fill.label}: {money(fill.kg_amount)}kg
                          </span>
                          {canFill ? (
                            <button
                              type="button"
                              className="text-status-breach-fg hover:underline"
                              onClick={() => void handleRemoveFill(line, fill.id)}
                              disabled={busy === `fill-${line.id}`}
                            >
                              {strings.buyInstructions.removeFill}
                            </button>
                          ) : null}
                        </div>
                      ))}
                      {canFill ? (
                        <div className="mt-1 flex items-center gap-1">
                          <Input
                            className="h-8 w-20 px-2 text-xs"
                            placeholder={strings.buyInstructions.fillLabel}
                            value={fillDrafts[line.id]?.label ?? ""}
                            onChange={(e) =>
                              setFillDrafts((prev) => ({
                                ...prev,
                                [line.id]: { label: e.target.value, amount: prev[line.id]?.amount ?? "" },
                              }))
                            }
                          />
                          <Input
                            className="h-8 w-20 px-2 text-xs"
                            placeholder={strings.buyInstructions.fillAmount}
                            inputMode="decimal"
                            value={fillDrafts[line.id]?.amount ?? ""}
                            onChange={(e) =>
                              setFillDrafts((prev) => ({
                                ...prev,
                                [line.id]: { label: prev[line.id]?.label ?? "", amount: e.target.value },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 px-2 text-xs"
                            onClick={() => void handleAddFill(line)}
                            disabled={busy === `fill-${line.id}`}
                          >
                            {strings.buyInstructions.addFill}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2 text-right font-medium" data-numeric>{money(line.balance_kg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {reconciliation ? (
        <Card>
          <h2 className="text-lg font-semibold text-fg-primary">{strings.buyInstructions.reconciliation.title}</h2>
          <p className="text-sm text-fg-tertiary">
            {strings.buyInstructions.reconciliation.subtitle}: {reconciliation.week_start} – {reconciliation.week_end}
          </p>

          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b border-subtle text-left text-fg-tertiary">
                <th className="py-2 pr-3">{strings.buyInstructions.reconciliation.saleyard}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.reconciliation.schw}</th>
                <th className="py-2 pr-3 text-right">{strings.buyInstructions.reconciliation.heads}</th>
                <th className="py-2 text-right">{strings.buyInstructions.reconciliation.actualCostColumn}</th>
              </tr>
            </thead>
            <tbody>
              {reconciliation.by_saleyard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-fg-tertiary">
                    No buys recorded in this trading week yet.
                  </td>
                </tr>
              ) : (
                reconciliation.by_saleyard.map((row) => (
                  <tr key={row.saleyard} className="border-b border-subtle">
                    <td className="py-2 pr-3 font-medium">{row.saleyard}</td>
                    <td className="py-2 pr-3 text-right" data-numeric>{money(row.schw_kg)}</td>
                    <td className="py-2 pr-3 text-right" data-numeric>{row.heads}</td>
                    <td className="py-2 text-right" data-numeric>{money(row.actual_cost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-subtle pt-4 text-sm sm:grid-cols-3">
            <SummaryRow label={strings.buyInstructions.reconciliation.actualHeads} value={String(reconciliation.summary.actual_heads)} />
            <SummaryRow label={strings.buyInstructions.reconciliation.expectedHeads} value={money(reconciliation.summary.expected_heads)} />
            <SummaryRow label={strings.buyInstructions.reconciliation.orderedSchw} value={money(reconciliation.summary.ordered_schw)} />
            <SummaryRow label={strings.buyInstructions.reconciliation.boughtSchw} value={money(reconciliation.summary.bought_schw)} />
            <SummaryRow
              label={strings.buyInstructions.reconciliation.surplusShortfall}
              value={money(reconciliation.summary.surplus_shortfall_schw)}
            />
            <SummaryRow label={strings.buyInstructions.reconciliation.expectedCost} value={money(reconciliation.summary.expected_cost)} />
            <SummaryRow label={strings.buyInstructions.reconciliation.actualCost} value={money(reconciliation.summary.actual_cost)} />
            <SummaryRow label={strings.buyInstructions.reconciliation.costVariance} value={money(reconciliation.summary.cost_variance)} />
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-tertiary">{label}</span>
      <span className="font-medium" data-numeric>
        {value}
      </span>
    </div>
  );
}
