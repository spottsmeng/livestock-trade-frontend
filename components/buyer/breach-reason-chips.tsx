"use client";

import { cn } from "@/lib/cn";
import { strings } from "@/lib/strings";

export function BreachReasonChips({ value, onChange }: { value: string | null; onChange: (reason: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={strings.buyer.buyLog.breachReasonLabel}>
      {strings.buyer.buyLog.breachReasons.map((reason) => (
        <button
          key={reason}
          type="button"
          aria-pressed={value === reason}
          onClick={() => onChange(reason)}
          className={cn(
            "min-h-[44px] rounded-full border px-3 py-1.5 text-sm font-medium",
            value === reason
              ? "border-accent-default bg-accent-subtle text-accent-default"
              : "border-default text-fg-secondary"
          )}
        >
          {reason}
        </button>
      ))}
    </div>
  );
}
