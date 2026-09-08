"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import { buyInstructionsApi, type BuyInstruction } from "@/lib/buy-instructions-api";
import { publicationsApi } from "@/lib/publications-api";

const STATUS_VARIANT: Record<BuyInstruction["status"], "neutral" | "accent" | "pass"> = {
  DRAFT: "neutral",
  ISSUED: "accent",
  ACKNOWLEDGED: "accent",
  RECONCILED: "pass",
};

export default function BuyInstructionsPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.buyInstructions.title}>
        <BuyInstructionsContent />
      </AppShell>
    </AuthGuard>
  );
}

function BuyInstructionsContent() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [instructions, setInstructions] = React.useState<BuyInstruction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [hasCurrentPublication, setHasCurrentPublication] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const rows = await buyInstructionsApi.list(accessToken);
      setInstructions(rows);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const publication = await publicationsApi.getCurrent(accessToken);
      const instruction = await buyInstructionsApi.generate(
        { snapshot_id: publication.snapshot_id, publication_id: publication.id },
        accessToken
      );
      toast({ title: `${instruction.instruction_no} generated` });
      await load();
    } catch {
      setHasCurrentPublication(false);
      toast({ title: strings.buyInstructions.noPublication, variant: "danger" });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {/* AppShell already renders the page's <h1> (its title bar) — this is the content area's own heading. */}
        <h2 className="text-xl font-semibold text-fg-primary">{strings.buyInstructions.title}</h2>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? strings.buyInstructions.generating : strings.buyInstructions.generate}
        </Button>
      </div>

      {!hasCurrentPublication ? <p className="text-sm text-status-breach-fg">{strings.buyInstructions.noPublication}</p> : null}

      {loading ? (
        <p className="text-sm text-fg-tertiary">Loading…</p>
      ) : instructions.length === 0 ? (
        <EmptyState title={strings.buyInstructions.empty} />
      ) : (
        <div className="flex flex-col gap-2">
          {instructions.map((instruction) => (
            <Link key={instruction.id} href={`/buy-instructions/${instruction.id}`}>
              <Card className="flex items-center justify-between transition-colors hover:bg-sunken">
                <div>
                  <p className="font-medium text-fg-primary">
                    {instruction.instruction_no} <span className="text-fg-tertiary">v{instruction.version}</span>
                  </p>
                  <p className="text-sm text-fg-tertiary">
                    {instruction.trade_date} · {instruction.lines.length} lines
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[instruction.status]}>{instruction.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
