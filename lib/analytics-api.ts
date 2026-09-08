import { apiFetch } from "./api-client";

// §13.2 — the owner's dashboard panels. Field names/types mirror the
// backend's schemas/analytics.py response models exactly (Decimal fields
// arrive as strings, same convention as every other console API client in
// this repo, e.g. lib/buy-instructions-api.ts).

export type OrderBookSpeciesRow = {
  species: string;
  exposure_aud: string;
  heads_required: string;
  heads_bought: number;
  days_of_cover: string | null;
};

export type OrderBookCustomerRow = { species: string; customer_name: string | null; exposure_aud: string };

export type OrderBookResponse = {
  snapshot_id: string | null;
  as_of_date: string | null;
  total_exposure_aud: string;
  by_species: OrderBookSpeciesRow[];
  by_customer: OrderBookCustomerRow[];
};

export type DnbpTrendPoint = { published_at: string; dnbp_per_kg: string };
export type ActualPaidPoint = { trade_date: string; avg_paid_per_kg: string };
export type DnbpTrendResponse = {
  species: string;
  days: number;
  dnbp_points: DnbpTrendPoint[];
  actual_paid_points: ActualPaidPoint[];
};

export type BuyerPerformanceRow = {
  buyer_id: string;
  buyer_email: string;
  entry_count: number;
  headroom_captured_aud: string;
  breach_count: number;
  breach_rate: string;
  avg_variance_per_kg: string | null;
};
export type SaleyardHeadroomRow = { saleyard: string; headroom_captured_aud: string };
export type BuyerPerformanceResponse = {
  from_: string | null;
  to: string | null;
  by_buyer: BuyerPerformanceRow[];
  by_saleyard: SaleyardHeadroomRow[];
};

export type MarginBridgeResponse = {
  snapshot_id: string | null;
  line_count: number;
  avg_sell_price_aud: string | null;
  avg_adjusted_price_per_kg: string | null;
  avg_pack_cost_per_kg: string | null;
  avg_offal_return_per_kg: string | null;
  avg_skin_return_per_kg: string | null;
  avg_bing_dnbp: string | null;
  avg_profit_on_peter_costs: string | null;
};

export type FulfilmentRow = {
  trade_date: string;
  instructed_schw_kg: string;
  bought_schw_kg: string;
  shortfall_schw_kg: string;
};
export type FulfilmentResponse = { from_: string | null; to: string | null; rows: FulfilmentRow[] };

export type BreachRow = {
  id: string;
  buyer_id: string;
  buyer_email: string;
  saleyard: string;
  trade_date: string;
  species: string;
  variance_per_kg: string;
  price_per_head: string;
  weight_kg: string;
};
export type BlockedLineRow = { order_line_id: string; contract_no: string | null; species: string | null; code: string; message: string };
export type StalePublicationRow = { publication_id: string; published_at: string; hours_stale: string };
export type UndeliveredInstructionRow = { instruction_id: string; instruction_no: string; trade_date: string; status: string };
export type UndeliveredPublicationRow = { publication_id: string; buyer_id: string; buyer_email: string; delivered_at: string | null };

export type ExceptionsResponse = {
  from_: string | null;
  to: string | null;
  breaches: BreachRow[];
  blocked_lines: BlockedLineRow[];
  stale_publications: StalePublicationRow[];
  undelivered_instructions: UndeliveredInstructionRow[];
  undelivered_publications: UndeliveredPublicationRow[];
};

export type OverviewResponse = {
  from_: string | null;
  to: string | null;
  active_exposure_aud: string;
  heads_required_total: string;
  heads_bought_total: number;
  open_correction_requests: number;
  breach_count: number;
  blocked_line_count: number;
  stale_publication_count: number;
  undelivered_instruction_count: number;
};

function auth(accessToken: string | null) {
  return { accessToken };
}

function qs(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  const s = query.toString();
  return s ? `?${s}` : "";
}

export const analyticsApi = {
  getOverview: (accessToken: string | null, params?: { from?: string; to?: string }) =>
    apiFetch<OverviewResponse>(`/analytics/overview${qs({ from: params?.from, to: params?.to })}`, auth(accessToken)),

  getOrderBook: (accessToken: string | null) => apiFetch<OrderBookResponse>("/analytics/order-book", auth(accessToken)),

  getDnbpTrend: (accessToken: string | null, species: string, days = 30) =>
    apiFetch<DnbpTrendResponse>(`/analytics/dnbp-trend${qs({ species, days: String(days) })}`, auth(accessToken)),

  getBuyerPerformance: (accessToken: string | null, params?: { buyer_id?: string; from?: string; to?: string }) =>
    apiFetch<BuyerPerformanceResponse>(
      `/analytics/buyer-performance${qs({ buyer_id: params?.buyer_id, from: params?.from, to: params?.to })}`,
      auth(accessToken)
    ),

  getMarginBridge: (accessToken: string | null, snapshotId?: string) =>
    apiFetch<MarginBridgeResponse>(`/analytics/margin-bridge${qs({ snapshot_id: snapshotId })}`, auth(accessToken)),

  getFulfilment: (accessToken: string | null, params?: { from?: string; to?: string }) =>
    apiFetch<FulfilmentResponse>(`/analytics/fulfilment${qs({ from: params?.from, to: params?.to })}`, auth(accessToken)),

  getBreaches: (accessToken: string | null, params?: { from?: string; to?: string; saleyard?: string }) =>
    apiFetch<ExceptionsResponse>(
      `/analytics/breaches${qs({ from: params?.from, to: params?.to, saleyard: params?.saleyard })}`,
      auth(accessToken)
    ),
};
