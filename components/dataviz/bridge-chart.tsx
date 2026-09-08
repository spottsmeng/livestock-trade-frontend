import * as React from "react";
import { cn } from "@/lib/cn";

export type BridgeStep = { label: string; value: string; hero?: boolean };

/**
 * §13.2 item 4's margin bridge, rendered as two connected step sequences
 * rather than one arithmetic waterfall — see services/analytics_service
 * .margin_bridge's own docstring (backend) for why: AC = X * factor does
 * NOT algebraically subtract Y/Z/AA (those feed AB/AD instead), so forcing
 * all five columns into one bar-stacks-to-a-total waterfall would visually
 * claim an arithmetic relationship the engine doesn't compute. The
 * source-of-truth path (G -> X -> AC) is the accent "hero" row; the
 * supporting-profit path (X -> Y/Z/AA -> AB) is muted, explicitly labelled
 * as supporting analysis, not part of the DNBP derivation.
 */
export function BridgeChart({ heroSteps, supportingSteps }: { heroSteps: BridgeStep[]; supportingSteps: BridgeStep[] }) {
  return (
    <div className="flex flex-col gap-6">
      <BridgeRow title="Source of truth — how AC is derived" steps={heroSteps} hero />
      <BridgeRow title="Supporting analysis — profit context, does not feed AC" steps={supportingSteps} />
    </div>
  );
}

function BridgeRow({ title, steps, hero }: { title: string; steps: BridgeStep[]; hero?: boolean }) {
  if (steps.every((s) => s.value === "—")) {
    return null;
  }
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-tertiary">{title}</h3>
      <div className="flex flex-wrap items-stretch gap-2">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            {i > 0 ? (
              <span className="flex items-center text-fg-tertiary" aria-hidden="true">
                →
              </span>
            ) : null}
            <div
              className={cn(
                "flex min-w-28 flex-col justify-center rounded-md border px-3 py-2",
                hero && step.hero
                  ? "border-accent-default bg-accent-subtle"
                  : "border-subtle bg-surface"
              )}
            >
              <span className="text-xs text-fg-tertiary">{step.label}</span>
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  hero && step.hero ? "text-accent-default" : "text-fg-primary"
                )}
              >
                {step.value}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
