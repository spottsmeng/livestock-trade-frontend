import { apiFetch, API_BASE_URL, ApiError } from "./api-client";

export type BuyInstructionFill = {
  id: string;
  label: string;
  kg_amount: string;
  entered_by: string;
  entered_at: string;
};

export type BuyInstructionLine = {
  id: string;
  seq: number;
  order_line_id: string;
  contract_no: string | null;
  species: string;
  schw_kg: string;
  expected_heads: string;
  weight_requirement_kg: string;
  dnbp_per_kg: string;
  peters_expectation: string | null;
  expected_livestock_cost: string;
  fills: BuyInstructionFill[];
  balance_kg: string;
};

export type BuyInstruction = {
  id: string;
  org_id: string;
  instruction_no: string;
  version: number;
  trade_date: string;
  snapshot_id: string;
  publication_id: string;
  prepared_by: string;
  approved_by: string | null;
  approved_at: string | null;
  note: string | null;
  status: "DRAFT" | "ISSUED" | "ACKNOWLEDGED" | "RECONCILED";
  lines: BuyInstructionLine[];
};

export type SaleyardReconciliation = {
  saleyard: string;
  schw_kg: string;
  heads: number;
  actual_cost: string;
};

export type ReconciliationSummary = {
  actual_heads: number;
  expected_heads: string;
  ordered_schw: string;
  bought_schw: string;
  surplus_shortfall_schw: string;
  expected_cost: string;
  actual_cost: string;
  cost_variance: string;
};

export type Reconciliation = {
  week_start: string;
  week_end: string;
  by_saleyard: SaleyardReconciliation[];
  summary: ReconciliationSummary;
};

function auth(accessToken: string | null) {
  return { accessToken };
}

export const buyInstructionsApi = {
  generate: (
    body: { snapshot_id: string; publication_id: string; trade_date?: string; note?: string },
    accessToken: string | null
  ) => apiFetch<BuyInstruction>("/buy-instructions", { method: "POST", body, ...auth(accessToken) }),

  list: (accessToken: string | null) => apiFetch<BuyInstruction[]>("/buy-instructions", auth(accessToken)),

  get: (id: string, accessToken: string | null) => apiFetch<BuyInstruction>(`/buy-instructions/${id}`, auth(accessToken)),

  updateNote: (id: string, note: string | null, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${id}`, { method: "PATCH", body: { note }, ...auth(accessToken) }),

  approve: (id: string, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${id}/approve`, { method: "POST", ...auth(accessToken) }),

  issue: (id: string, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${id}/issue`, { method: "POST", ...auth(accessToken) }),

  reconcileClose: (id: string, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${id}/reconcile-close`, { method: "POST", ...auth(accessToken) }),

  addFill: (instructionId: string, lineId: string, label: string, kgAmount: string, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${instructionId}/lines/${lineId}/fills`, {
      method: "POST",
      body: { label, kg_amount: kgAmount },
      ...auth(accessToken),
    }),

  removeFill: (instructionId: string, lineId: string, fillId: string, accessToken: string | null) =>
    apiFetch<BuyInstruction>(`/buy-instructions/${instructionId}/lines/${lineId}/fills/${fillId}`, {
      method: "DELETE",
      ...auth(accessToken),
    }),

  getReconciliation: (id: string, accessToken: string | null) =>
    apiFetch<Reconciliation>(`/buy-instructions/${id}/reconciliation`, auth(accessToken)),

  /**
   * Export isn't a JSON route — apiFetch always requests/parses JSON, so
   * this hits fetch directly and hands back a Blob for the caller to save.
   * Same auth/credentials shape as apiFetch, just a different response type.
   */
  async downloadExport(id: string, format: "pdf" | "xlsx", accessToken: string | null): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/v1/buy-instructions/${id}/export?format=${format}`, {
      credentials: "include",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const err = payload?.error ?? { code: "UNKNOWN_ERROR", message: "Export failed.", details: null };
      throw new ApiError(response.status, err.code, err.message, err.details);
    }
    return response.blob();
  },
};
