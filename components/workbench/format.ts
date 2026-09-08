/** Shared formatting for the Workbench grid and its provenance popovers. */

export function formatMoney(value: string | null, dp = 2): string {
  if (value === null) return "—";
  return Number(value).toFixed(dp);
}

export function formatRate(value: string | null, dp = 4): string {
  if (value === null) return "—";
  return Number(value).toFixed(dp);
}

export function formatDate(value: string | null): string {
  return value ?? "—";
}

export function formatText(value: string | null): string {
  return value && value.length > 0 ? value : "—";
}
