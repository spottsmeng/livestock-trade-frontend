"use client";

import { Card } from "@/components/ui/card";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/cn";

export function OnboardingTooltipsSetting() {
  const enabled = useOnboardingStore((s) => s.tooltipsEnabled);
  const setTooltipsEnabled = useOnboardingStore((s) => s.setTooltipsEnabled);
  const s = strings.settings.onboardingTooltips;

  return (
    <Card className="flex items-center justify-between gap-6">
      <div>
        <h2 className="text-sm font-semibold text-fg-primary">{s.title}</h2>
        <p className="mt-1 text-sm text-fg-secondary">{s.description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={s.title}
        onClick={() => setTooltipsEnabled(!enabled)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border border-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
          enabled ? "bg-accent-default" : "bg-sunken"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-1 transition-transform",
            enabled ? "translate-x-6" : "translate-x-0.5"
          )}
        />
      </button>
    </Card>
  );
}
