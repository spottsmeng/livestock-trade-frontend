import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

// Tier-3 component tokens only (PRD §15.1) — every colour/spacing value
// here traces back to packages/design-tokens/tokens.json. No raw hex, no
// arbitrary Tailwind values.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent-default text-accent-fg hover:bg-accent-hover active:bg-accent-active",
        secondary: "bg-surface text-fg-primary border border-default hover:bg-sunken",
        ghost: "text-fg-primary hover:bg-sunken",
        danger: "bg-status-danger text-accent-fg hover:opacity-90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-12 px-4",
        lg: "h-14 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
