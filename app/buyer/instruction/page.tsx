"use client";

import * as React from "react";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BuyerBottomNav } from "@/components/buyer/bottom-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import { buyerApi, type Instruction } from "@/lib/buyer-api";

export default function BuyerInstructionPage() {
  return (
    <AuthGuard requiredRole="BUYER">
      <AppShell title={strings.buyer.instruction.title}>
        <InstructionContent />
      </AppShell>
      <BuyerBottomNav />
    </AuthGuard>
  );
}

function InstructionContent() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [instruction, setInstruction] = React.useState<Instruction | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [acknowledging, setAcknowledging] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const data = await buyerApi.getInstructionCurrent(accessToken);
      setInstruction(data);
    } catch {
      setInstruction(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function handleAcknowledge() {
    if (!instruction) return;
    setAcknowledging(true);
    try {
      await buyerApi.acknowledgeInstruction(instruction.instruction_id, accessToken);
      toast({ title: strings.buyer.instruction.acknowledged });
      await load();
    } catch {
      toast({ title: "Could not acknowledge", variant: "danger" });
    } finally {
      setAcknowledging(false);
    }
  }

  if (loading) {
    return <p className="p-4 text-sm text-fg-tertiary">Loading…</p>;
  }

  if (!instruction) {
    return <EmptyState title={strings.buyer.instruction.none} />;
  }

  const alreadyAcknowledged = instruction.status !== "ISSUED";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-fg-primary">{instruction.instruction_no}</p>
          <p className="text-sm text-fg-tertiary">{instruction.trade_date}</p>
        </div>
        <Badge variant={alreadyAcknowledged ? "pass" : "accent"}>{instruction.status}</Badge>
      </div>

      {instruction.saleyard ? (
        <div className="rounded-md border border-subtle bg-surface p-3 text-sm">
          <p className="text-fg-tertiary">{strings.buyer.instruction.saleyard}</p>
          <p className="font-medium text-fg-primary">{instruction.saleyard}</p>
          {instruction.prepayment_note ? (
            <p className="mt-1 text-xs text-fg-tertiary">{instruction.prepayment_note}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {instruction.lines.map((line, idx) => (
          <div key={idx} className="rounded-md border border-subtle bg-surface p-4">
            <p className="text-base font-semibold text-fg-primary">{line.contract_no ?? line.species}</p>
            <p className="text-sm text-fg-secondary">{line.species}</p>
            <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-fg-tertiary">{strings.buyer.instruction.targetHeads}</span>
              <span className="text-right font-medium" data-numeric>
                {Math.round(Number(line.target_heads))}
              </span>
              <span className="text-fg-tertiary">{strings.buyer.instruction.weightRequirement}</span>
              <span className="text-right font-medium" data-numeric>
                {Number(line.weight_requirement_kg).toFixed(1)} kg
              </span>
              <span className="text-fg-tertiary">{strings.buyer.instruction.dnbp}</span>
              <span className="text-right text-lg font-bold text-accent-default" data-numeric>
                ${Number(line.dnbp_per_kg).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!alreadyAcknowledged ? (
        <Button size="lg" className="mt-2" onClick={handleAcknowledge} disabled={acknowledging}>
          {acknowledging ? strings.buyer.instruction.acknowledging : strings.buyer.instruction.acknowledge}
        </Button>
      ) : null}
    </div>
  );
}
