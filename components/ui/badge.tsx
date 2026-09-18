import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "bg-sunken text-fg-secondary",
      accent: "bg-accent-subtle text-accent-default",
      pass: "bg-status-pass-bg text-status-pass-fg",
      close: "bg-status-close-bg text-status-close-fg",
      breach: "bg-status-breach-bg text-status-breach-fg",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

// forwardRef (rather than the plain function component this used to be) so
// a Badge can be used as a Radix Tooltip/Popover trigger's `asChild` child —
// components/ui/status-badge and sync-status-badge wrap themselves in an
// onboarding tooltip this way, same ref-passthrough need Button/Input/Checkbox
// already have.
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <span ref={ref} className={cn(badgeVariants({ variant, className }))} {...props} />;
});
Badge.displayName = "Badge";
