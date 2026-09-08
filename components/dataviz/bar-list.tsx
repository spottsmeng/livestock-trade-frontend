"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Ranked magnitude comparison across named categories (e.g. exposure by
 * species, headroom by buyer) — per the dataviz skill's form guidance, this
 * is a MAGNITUDE encoding, not an identity encoding, so it deliberately
 * uses ONE sequential hue (the accent token) for every bar rather than a
 * categorical palette per row; species/buyer identity is carried by the
 * text label, not by color (the token system only defines one non-status
 * hue — see this component's own design note in components/dashboard —
 * so a bar-list form sidesteps needing a multi-hue categorical palette
 * that doesn't exist yet).
 *
 * Always renders a real <table> alongside the bars (dataviz skill's "a
 * table view exists" accessibility requirement) rather than only a visual
 * bar — every value is keyboard- and screen-reader-reachable independent
 * of the bars.
 */
export function BarList({
  rows,
  valueLabel,
  formatValue,
  className,
}: {
  rows: { label: string; value: number; sublabel?: string }[];
  valueLabel: string;
  formatValue: (value: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));

  if (rows.length === 0) {
    return <p className="text-sm text-fg-tertiary">No data in this window.</p>;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <ul className="flex flex-col gap-2" aria-hidden="true">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium text-fg-primary">
                {row.label}
                {row.sublabel ? <span className="ml-1 text-fg-tertiary">· {row.sublabel}</span> : null}
              </span>
              <span className="tabular-nums text-fg-secondary">{formatValue(row.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <div
                className="h-full rounded-full bg-accent-default"
                style={{ width: `${Math.max(2, (Math.abs(row.value) / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>{valueLabel} by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{formatValue(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
