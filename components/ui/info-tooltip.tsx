"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOnboardingStore } from "@/lib/onboarding-store";
import { strings } from "@/lib/strings";
import { cn } from "@/lib/cn";

/**
 * The onboarding "i" icon — hover or focus reveals what a computed/derived
 * figure means and how it's worked out, in plain English. Renders nothing
 * at all when the user has turned onboarding tooltips off (settings page:
 * components/settings/onboarding-tooltips-setting.tsx), so an experienced
 * user's screens stay uncluttered.
 */
export function InfoTooltip({
  label,
  what,
  how,
  className,
}: {
  /** Accessible name, e.g. "About headroom captured" — read by screen readers, never shown visually. */
  label: string;
  /** One or two plain-English sentences: what this figure is and why it matters. */
  what: string;
  /** One or two plain-English sentences: the calculation behind it. */
  how: string;
  className?: string;
}) {
  const enabled = useOnboardingStore((s) => s.tooltipsEnabled);
  if (!enabled) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-default text-xs font-semibold leading-none text-fg-tertiary hover:border-accent-default hover:text-accent-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
            className
          )}
        >
          i
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold text-fg-primary">{strings.onboarding.whatLabel}</p>
        <p className="text-fg-secondary">{what}</p>
        <p className="mt-2 font-semibold text-fg-primary">{strings.onboarding.howLabel}</p>
        <p className="text-fg-secondary">{how}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** For badges/labels that already have their own tag-like affordance
 * (StatusBadge, SyncStatusBadge) — makes the element itself the hover
 * target instead of adding a second "i" icon next to every occurrence in
 * a list. Same on/off behaviour as InfoTooltip: renders children
 * unwrapped when onboarding tooltips are off. */
export function InfoTooltipWrap({
  what,
  how,
  children,
}: {
  what: string;
  how: string;
  children: React.ReactElement;
}) {
  const enabled = useOnboardingStore((s) => s.tooltipsEnabled);
  if (!enabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold text-fg-primary">{strings.onboarding.whatLabel}</p>
        <p className="text-fg-secondary">{what}</p>
        <p className="mt-2 font-semibold text-fg-primary">{strings.onboarding.howLabel}</p>
        <p className="text-fg-secondary">{how}</p>
      </TooltipContent>
    </Tooltip>
  );
}
