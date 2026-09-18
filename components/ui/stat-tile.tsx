import * as React from "react";
import { cn } from "@/lib/cn";
import { InfoTooltip } from "@/components/ui/info-tooltip";

/** §15.5 names StatTile as a required component; built now, incrementally,
 * for the dashboard's KPI row — the same "build what's actually needed"
 * precedent every prior phase followed rather than the full §15.5 list
 * up front. */
export function StatTile({
  label,
  value,
  hint,
  tooltip,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Onboarding explanation for a computed/derived figure — omit for a raw,
   * self-explanatory value. */
  tooltip?: { label: string; what: string; how: string };
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-subtle bg-surface p-4", className)}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-fg-tertiary">
        <span>{label}</span>
        {tooltip ? <InfoTooltip {...tooltip} /> : null}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-fg-primary">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-tertiary">{hint}</div> : null}
    </div>
  );
}
