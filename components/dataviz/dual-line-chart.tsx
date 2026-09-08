"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export type LinePoint = { x: string; y: number };

/**
 * Two-series comparison over time (DNBP trend's "ceiling vs actual paid" —
 * §13.2's hero chart; fulfilment's "instructed vs bought"). Deliberately
 * NOT a categorical multi-hue chart: one series is the accent-colour
 * "hero" line (solid, heavier), the other a muted reference line (dashed,
 * text-tertiary token) — this token system defines only one non-status hue
 * (see components/dashboard's own note), and a hero/reference pairing is
 * the right encoding for "ceiling vs what actually happened" regardless.
 * Legend always present (dataviz skill: >=2 series always gets one); a
 * real <table> ships alongside for keyboard/screen-reader access to exact
 * values, and every point carries a native <title> for a mouse tooltip —
 * a intentionally lighter-weight hover affordance than a full crosshair
 * layer, given this phase's scope.
 */
export function DualLineChart({
  heroLabel,
  hero,
  referenceLabel,
  reference,
  formatValue,
  height = 220,
  className,
}: {
  heroLabel: string;
  hero: LinePoint[];
  referenceLabel: string;
  reference: LinePoint[];
  formatValue: (value: number) => string;
  height?: number;
  className?: string;
}) {
  const width = 640;
  const padding = { top: 12, right: 12, bottom: 28, left: 12 };
  const allPoints = [...hero, ...reference];

  if (allPoints.length === 0) {
    return <p className="text-sm text-fg-tertiary">No data in this window.</p>;
  }

  const values = allPoints.map((p) => p.y);
  const minY = Math.min(0, ...values);
  const maxY = Math.max(...values, minY + 1);
  const labels = Array.from(new Set(allPoints.map((p) => p.x))).sort();

  const xFor = (label: string) => {
    const idx = labels.indexOf(label);
    const span = Math.max(1, labels.length - 1);
    return padding.left + (idx / span) * (width - padding.left - padding.right);
  };
  const yFor = (value: number) => {
    const span = maxY - minY || 1;
    return height - padding.bottom - ((value - minY) / span) * (height - padding.top - padding.bottom);
  };

  const pathFor = (series: LinePoint[]) =>
    series
      .slice()
      .sort((a, b) => (a.x < b.x ? -1 : 1))
      .map((p, i) => `${i === 0 ? "M" : "L"}${xFor(p.x).toFixed(1)},${yFor(p.y).toFixed(1)}`)
      .join(" ");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-accent-default" aria-hidden="true" />
          <span className="text-fg-secondary">{heroLabel}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full border-t-2 border-dashed border-fg-tertiary" aria-hidden="true" />
          <span className="text-fg-secondary">{referenceLabel}</span>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${heroLabel} versus ${referenceLabel} over time`}
        className="w-full"
      >
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          className="stroke-subtle"
          strokeWidth={1}
        />
        <path d={pathFor(reference)} fill="none" className="stroke-fg-tertiary" strokeWidth={2} strokeDasharray="4 3" />
        <path d={pathFor(hero)} fill="none" className="stroke-accent-default" strokeWidth={2} />
        {hero.map((p, i) => (
          // Index included: two points can legitimately share an x (e.g.
          // two publications on the same calendar day) — x alone isn't a
          // stable unique key then (confirmed live: real dev DB data with
          // same-day republishes tripped React's duplicate-key warning).
          <circle key={`hero-${p.x}-${i}`} cx={xFor(p.x)} cy={yFor(p.y)} r={4} className="fill-accent-default">
            <title>
              {heroLabel} · {p.x}: {formatValue(p.y)}
            </title>
          </circle>
        ))}
        {reference.map((p, i) => (
          <circle key={`ref-${p.x}-${i}`} cx={xFor(p.x)} cy={yFor(p.y)} r={3} className="fill-fg-tertiary">
            <title>
              {referenceLabel} · {p.x}: {formatValue(p.y)}
            </title>
          </circle>
        ))}
      </svg>

      <table className="sr-only">
        <caption>
          {heroLabel} versus {referenceLabel}
        </caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{heroLabel}</th>
            <th scope="col">{referenceLabel}</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label) => {
            // A label (date) can carry more than one point — e.g. two
            // publications on the same calendar day — so every matching
            // value is listed, not just the first (a .find() here would
            // silently drop the rest from the accessible table view while
            // the chart itself still plots them).
            const hs = hero.filter((p) => p.x === label);
            const rs = reference.filter((p) => p.x === label);
            return (
              <tr key={label}>
                <td>{label}</td>
                <td>{hs.length ? hs.map((p) => formatValue(p.y)).join(", ") : "—"}</td>
                <td>{rs.length ? rs.map((p) => formatValue(p.y)).join(", ") : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
