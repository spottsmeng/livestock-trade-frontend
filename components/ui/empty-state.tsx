import * as React from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  body,
  className,
  children,
}: {
  title: string;
  body?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-subtle p-12 text-center",
        className
      )}
    >
      <p className="text-lg font-semibold text-fg-primary">{title}</p>
      {body ? <p className="max-w-md text-sm text-fg-secondary">{body}</p> : null}
      {children}
    </div>
  );
}
