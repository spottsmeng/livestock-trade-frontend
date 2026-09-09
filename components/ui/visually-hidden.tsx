import type { ReactNode } from "react";

/**
 * Wraps content that must stay in the accessibility tree but never paint
 * on screen. Apply sr-only here, never directly to a <table> — a table's
 * <caption> lives in the browser's anonymous table-wrapper box, outside
 * the table's own border box, so overflow/clip-path set on the <table>
 * itself never reaches the caption. A div has no such split.
 */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <div className="sr-only">{children}</div>;
}
