import * as React from "react";
import { cn } from "@/lib/cn";

/** §15.5 names StatTile as a required component; built now, incrementally,
 * for the dashboard's KPI row — the same "build what's actually needed"
 * precedent every prior phase followed rather than the full §15.5 list
 * up front. */
export function StatTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-subtle bg-surface p-4", className)}>
      <div className="text-xs font-medium text-fg-tertiary">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-fg-primary">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-tertiary">{hint}</div> : null}
    </div>
  );
}
