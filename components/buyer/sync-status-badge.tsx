import { Badge } from "@/components/ui/badge";
import { strings } from "@/lib/strings";
import type { SyncStatus } from "@/lib/buyer/db";

const DOT: Record<SyncStatus, string> = { queued: "⏳", syncing: "↻", synced: "✓", conflict: "⚠" };
const VARIANT: Record<SyncStatus, "neutral" | "pass" | "breach"> = {
  queued: "neutral",
  syncing: "neutral",
  synced: "pass",
  conflict: "breach",
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  return (
    <Badge variant={VARIANT[status]}>
      {DOT[status]} {strings.buyer.sync[status]}
    </Badge>
  );
}
