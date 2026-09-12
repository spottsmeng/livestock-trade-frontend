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
import type { OrderLine, ValidationIssue } from "@/lib/workbench-api";
import {
  connectConsoleSocket,
  publicationsApi,
  type PublicationDetail,
} from "@/lib/publications-api";

function lineLabel(line: OrderLine | undefined): string {
  if (!line) return "Line —";
  const ref = line.contract_no ?? line.customer_name;
  return ref ? `Line ${line.line_no} · ${ref}` : `Line ${line.line_no}`;
}

/** Plain-English grouping for the Publish screen's warning chips — one label
 * per business concern rather than the raw §5.7 issue code. */
function issueCategory(code: string): string {
  switch (code) {
    case "DNBP_BELOW_COST":
    case "NEGATIVE_MARGIN":
    case "DNBP_OUTLIER":
    case "LARGE_BENCHMARK_GAP":
      return "Pricing";
    case "HAND_SET_VALUE":
      return "Hand-set";
    case "RECEIVED_VALUE_MISMATCH":
    case "RECEIVED_BENCHMARK_ABSENT":
    case "MISSING_LIVESTOCK_COST":
    case "MISSING_AVG_WEIGHT":
      return "Missing/mismatched data";
    default:
      return code
        .toLowerCase()
        .split("_")
        .map((word) => word[0].toUpperCase() + word.slice(1))
        .join(" ");
  }
}

type LineIssueGroup = {
  lineId: string;
  line: OrderLine | undefined;
  issues: ValidationIssue[];
};

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
  lineById,
  onChanged,
}: {
  snapshotId: string;
  activeLineIds: Set<string>;
  issuesByLineId: Map<string, ValidationIssue[]>;
  lineById: Map<string, OrderLine>;
  onChanged: () => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [ackingLineId, setAckingLineId] = React.useState<string | null>(null);
  const [warningsExpanded, setWarningsExpanded] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [published, setPublished] = React.useState<PublicationDetail | null>(
    null,
  );
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
    (i) =>
      (i.severity === "WARN" || i.severity === "CORRECTION") &&
      !i.acknowledged_at,
  );

  const lineGroups = React.useMemo<LineIssueGroup[]>(() => {
    const byLine = new Map<string, ValidationIssue[]>();
    for (const issue of unacknowledged) {
      byLine.set(issue.order_line_id, [
        ...(byLine.get(issue.order_line_id) ?? []),
        issue,
      ]);
    }
    return Array.from(byLine.entries())
      .map(([lineId, issues]) => ({
        lineId,
        line: lineById.get(lineId),
        issues,
      }))
      .sort((a, b) => (a.line?.line_no ?? 0) - (b.line?.line_no ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unacknowledged is derived fresh from activeIssues every render; keying off it directly would memo nothing
  }, [issuesByLineId, activeLineIds, lineById]);

  const categoryCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const issue of unacknowledged) {
      const category = issueCategory(issue.code);
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see lineGroups
  }, [issuesByLineId, activeLineIds]);

  React.useEffect(() => {
    if (!published) return undefined;
    const socket = connectConsoleSocket(
      () => useAuthStore.getState().accessToken,
      (event, data) => {
        if (
          event === "delivery.updated" &&
          (data as { publication_id: string }).publication_id === published.id
        ) {
          publicationsApi
            .get(published.id, accessToken)
            .then(setPublished)
            .catch(() => {});
        }
      },
      () => {
        publicationsApi
          .get(published.id, accessToken)
          .then(setPublished)
          .catch(() => {});
      },
    );
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-subscribe when the published id itself changes
  }, [published?.id]);

  async function handleAcknowledgeLine(group: LineIssueGroup) {
    setAckingLineId(group.lineId);
    try {
      await Promise.all(
        group.issues.map((issue) =>
          publicationsApi.acknowledgeIssue(snapshotId, issue.id, accessToken),
        ),
      );
      onChanged();
    } finally {
      setAckingLineId(null);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const result = await publicationsApi.publish(
        snapshotId,
        undefined,
        accessToken,
      );
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
      <h2 className="text-lg font-semibold text-fg-primary">
        {strings.publication.publish.title}
      </h2>

      {blocked.length > 0 ? (
        <p className="mt-2 text-sm font-medium text-status-breach-fg">
          {strings.publication.publish.blocked}
        </p>
      ) : unacknowledged.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setWarningsExpanded((v) => !v)}
            aria-expanded={warningsExpanded}
            aria-controls="publish-warnings-detail"
            className="flex w-full items-center justify-between gap-3 rounded-md border-l-4 border-status-close-border bg-status-close-bg px-3 py-2.5 text-left"
          >
            <div className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-0.5 text-base leading-none text-status-close-fg"
              >
                ▲
              </span>
              <div>
                <p className="text-sm font-semibold text-status-close-fg">
                  {strings.publication.publish.warningsTitle}
                </p>
                <p className="mt-0.5 text-sm text-fg-secondary">
                  <span className="font-semibold text-fg-primary">
                    {lineGroups.length}
                  </span>{" "}
                  line
                  {lineGroups.length === 1 ? "" : "s"} need attention —{" "}
                  {Array.from(categoryCounts.entries())
                    .map(
                      ([category, count]) =>
                        `${count} ${category.toLowerCase()}`,
                    )
                    .join(" · ")}
                </p>
              </div>
            </div>
            <span className="shrink-0 whitespace-nowrap text-xs font-medium text-accent-default">
              {warningsExpanded ? "Hide details ▾" : "Show details ▸"}
            </span>
          </button>
          {warningsExpanded ? (
            <div id="publish-warnings-detail" className="flex flex-col gap-2">
              {lineGroups.map((group) => {
                const label = lineLabel(group.line);
                const chips = new Map<string, "close" | "neutral">();
                for (const issue of group.issues) {
                  const category = issueCategory(issue.code);
                  if (!chips.has(category))
                    chips.set(
                      category,
                      issue.severity === "WARN" ? "close" : "neutral",
                    );
                }
                return (
                  <div
                    key={group.lineId}
                    className="rounded-md border border-subtle px-3 py-2.5 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-fg-primary">
                          {label}
                        </span>
                        {group.line?.species ? (
                          <Badge variant="neutral">{group.line.species}</Badge>
                        ) : null}
                        {Array.from(chips.entries()).map(
                          ([category, variant]) => (
                            <Badge key={category} variant={variant}>
                              {category}
                            </Badge>
                          ),
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAcknowledgeLine(group)}
                        disabled={ackingLineId === group.lineId}
                        aria-label={`${strings.publication.publish.acknowledge}: ${label}`}
                        className="shrink-0"
                      >
                        {strings.publication.publish.acknowledge}
                      </Button>
                    </div>
                    <p className="mt-1.5 text-fg-secondary">
                      {group.issues.map((issue) => issue.message).join(" · ")}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
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
              This publishes the current Do Not Buy Price to every active buyer,
              immediately and over their preferred channel. This cannot be
              undone (only superseded by a later publish).
            </DialogDescription>
            <div className="mt-4 flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button onClick={handlePublish} disabled={publishing}>
                {publishing
                  ? strings.publication.publish.confirming
                  : strings.publication.publish.confirm}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {published ? (
        <div className="mt-6 border-t border-subtle pt-4">
          <p className="text-sm font-semibold text-fg-primary">
            {strings.publication.publish.summaryTitle}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {published.lines.map((line) => (
              <div
                key={line.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{line.species}</span>
                <span data-numeric>
                  ${Number(line.dnbp_per_kg).toFixed(2)}/kg
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-fg-primary">
            {strings.publication.publish.deliveryTitle}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {published.deliveries.length === 0 ? (
              <p className="text-sm text-fg-tertiary">No active buyers yet.</p>
            ) : (
              published.deliveries.map((delivery) => (
                <div
                  key={delivery.buyer_id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{delivery.buyer_email}</span>
                  <Badge
                    variant={
                      delivery.acknowledged_at
                        ? "pass"
                        : delivery.is_overdue
                          ? "breach"
                          : "neutral"
                    }
                  >
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
