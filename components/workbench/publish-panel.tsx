"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { strings } from "@/lib/strings";
import type { ValidationIssue } from "@/lib/workbench-api";
import { connectConsoleSocket, publicationsApi, type PublicationDetail } from "@/lib/publications-api";

/**
 * §11.5's Publish screen, built functionally rather than as a pixel-perfect
 * recreation of every visual embellishment in the PRD's prose (same scope
 * discipline Phase 2 used for the Workbench itself): per-species summary,
 * per-warning acknowledgement, a confirm step, then a live delivery
 * tracker fed by /ws/console.
 */
export function PublishPanel({
  snapshotId,
  activeLineIds,
  issuesByLineId,
  onChanged,
}: {
  snapshotId: string;
  activeLineIds: Set<string>;
  issuesByLineId: Map<string, ValidationIssue[]>;
  onChanged: () => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [acking, setAcking] = React.useState<string | null>(null);
  const [publishing, setPublishing] = React.useState(false);
  const [published, setPublished] = React.useState<PublicationDetail | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const activeIssues = React.useMemo(() => {
    const all: ValidationIssue[] = [];
    for (const [lineId, issues] of issuesByLineId) {
      if (activeLineIds.has(lineId)) all.push(...issues);
    }
    return all;
  }, [issuesByLineId, activeLineIds]);

  const blocked = activeIssues.filter((i) => i.severity === "BLOCK");
  const unacknowledged = activeIssues.filter(
    (i) => (i.severity === "WARN" || i.severity === "CORRECTION") && !i.acknowledged_at
  );

  React.useEffect(() => {
    if (!published) return undefined;
    const socket = connectConsoleSocket(
      () => useAuthStore.getState().accessToken,
      (event, data) => {
        if (event === "delivery.updated" && (data as { publication_id: string }).publication_id === published.id) {
          publicationsApi.get(published.id, accessToken).then(setPublished).catch(() => {});
        }
      },
      () => {
        publicationsApi.get(published.id, accessToken).then(setPublished).catch(() => {});
      }
    );
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-subscribe when the published id itself changes
  }, [published?.id]);

  async function handleAcknowledge(issue: ValidationIssue) {
    setAcking(issue.id);
    try {
      await publicationsApi.acknowledgeIssue(snapshotId, issue.id, accessToken);
      onChanged();
    } finally {
      setAcking(null);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const result = await publicationsApi.publish(snapshotId, undefined, accessToken);
      setPublished(result);
      setDialogOpen(false);
      toast({ title: strings.publication.publish.success });
      onChanged();
    } catch {
      toast({ title: "Could not publish", variant: "danger" });
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold text-fg-primary">{strings.publication.publish.title}</h2>

      {blocked.length > 0 ? (
        <p className="mt-2 text-sm font-medium text-status-breach-fg">{strings.publication.publish.blocked}</p>
      ) : unacknowledged.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm font-medium text-fg-secondary">{strings.publication.publish.warningsTitle}</p>
          {unacknowledged.map((issue) => (
            <div key={issue.id} className="flex items-center justify-between rounded-md border border-subtle px-3 py-2 text-sm">
              <span>
                <Badge variant={issue.severity === "WARN" ? "close" : "neutral"} className="mr-2">
                  {issue.severity}
                </Badge>
                {issue.message}
              </span>
              <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(issue)} disabled={acking === issue.id}>
                {strings.publication.publish.acknowledge}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-3" disabled={activeLineIds.size === 0}>
              {strings.publication.publish.confirm}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{strings.publication.publish.title}</DialogTitle>
            <DialogDescription>
              This publishes the current Do Not Buy Price to every active buyer, immediately and over their preferred
              channel. This cannot be undone (only superseded by a later publish).
            </DialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing ? strings.publication.publish.confirming : strings.publication.publish.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {published ? (
        <div className="mt-6 border-t border-subtle pt-4">
          <p className="text-sm font-semibold text-fg-primary">{strings.publication.publish.summaryTitle}</p>
          <div className="mt-2 flex flex-col gap-1">
            {published.lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{line.species}</span>
                <span data-numeric>${Number(line.dnbp_per_kg).toFixed(2)}/kg</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-fg-primary">{strings.publication.publish.deliveryTitle}</p>
          <div className="mt-2 flex flex-col gap-1">
            {published.deliveries.length === 0 ? (
              <p className="text-sm text-fg-tertiary">No active buyers yet.</p>
            ) : (
              published.deliveries.map((delivery) => (
                <div key={delivery.buyer_id} className="flex items-center justify-between text-sm">
                  <span>{delivery.buyer_email}</span>
                  <Badge variant={delivery.acknowledged_at ? "pass" : delivery.is_overdue ? "breach" : "neutral"}>
                    {delivery.acknowledged_at
                      ? `${strings.publication.publish.delivered} ✓ ${new Date(delivery.acknowledged_at).toLocaleTimeString()}`
                      : strings.publication.publish.notYetSeen}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
