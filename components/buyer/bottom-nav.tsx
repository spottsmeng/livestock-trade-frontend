"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { strings } from "@/lib/strings";

const TABS = [
  { href: "/buyer", label: strings.buyer.nav.dnbp },
  { href: "/buyer/bid-check", label: strings.buyer.nav.bidCheck },
  { href: "/buyer/buy-log", label: strings.buyer.nav.buyLog },
  { href: "/buyer/instruction", label: strings.buyer.nav.instruction },
  { href: "/buyer/scorecard", label: strings.buyer.nav.scorecard },
] as const;

/**
 * §12.2's thumb-zone action bar, generalised into a bottom nav across all
 * five PWA screens — Screen 4 (Instruction, Phase 4) and Screen 5
 * (Scorecard, Phase 5) both added on this same pattern as Phase 3 shipped
 * the first three. 56px+ touch targets throughout (§12.1).
 */
export function BuyerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-default bg-surface" aria-label="Buyer navigation">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 items-center justify-center py-4 text-base font-semibold transition-colors",
              "min-h-14", // 56px — Tailwind's own numeric scale, not an arbitrary value (§15.1)
              active ? "text-accent-default border-t-2 border-accent-default" : "text-fg-secondary"
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
