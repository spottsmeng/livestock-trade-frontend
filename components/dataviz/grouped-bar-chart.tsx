"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type GroupedBarRow = { label: string; a: number; b: number };

/**
 * Two-series-per-category comparison (fulfilment's instructed vs bought,
 * by trade date). Same hero/reference colour pairing as DualLineChart —
 * `a` (instructed) is the accent "hero" bar, `b` (bought) the muted
 * reference bar — for the same reason: this token system has one
 * non-status hue, and hero/reference is the right encoding for "planned
 * vs actual" regardless of hue count.
 */
export function GroupedBarChart({
  rows,
  labelA,
  labelB,
  formatValue,
  className,
}: {
  rows: GroupedBarRow[];
  labelA: string;
  labelB: string;
  formatValue: (value: number) => string;
  className?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-fg-tertiary">No data in this window.</p>;
  }

  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]));

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent-default" aria-hidden="true" />
          <span className="text-fg-secondary">{labelA}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-sunken" aria-hidden="true" />
          <span className="text-fg-secondary">{labelB}</span>
        </span>
      </div>

      <ul className="flex flex-col gap-3" aria-hidden="true">
        {rows.map((row) => (
          <li key={row.label} className="flex flex-col gap-1">
            <span className="text-sm font-medium text-fg-primary">{row.label}</span>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-canvas">
                  <div className="h-full bg-accent-default" style={{ width: `${(row.a / max) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-fg-secondary">
                  {formatValue(row.a)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-canvas">
                  <div className="h-full bg-fg-tertiary opacity-50" style={{ width: `${(row.b / max) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right text-xs tabular-nums text-fg-secondary">
                  {formatValue(row.b)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <table className="sr-only">
        <caption>
          {labelA} versus {labelB}, by trade date
        </caption>
        <thead>
          <tr>
            <th scope="col">Trade date</th>
            <th scope="col">{labelA}</th>
            <th scope="col">{labelB}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              <td>{formatValue(row.a)}</td>
              <td>{formatValue(row.b)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
