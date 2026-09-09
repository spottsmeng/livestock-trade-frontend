import { apiFetch } from "./api-client";

function auth(accessToken: string | null) {
  return { accessToken };
}

export type OrderLineRemoval = {
  id: string;
  snapshot_id: string;
  contract_no: string | null;
  species: string | null;
  product_type: string | null;
  incoterm: string | null;
  customer_name: string | null;
  amount_aud: string | null;
  detected_at: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  reason: string | null;
};

export const orderLineRemovalsApi = {
  list: (accessToken: string | null, unacknowledgedOnly?: boolean) =>
    apiFetch<OrderLineRemoval[]>(`/order-line-removals${unacknowledgedOnly ? "?unacknowledged=true" : ""}`, auth(accessToken)),
  acknowledge: (removalId: string, reason: string | null, accessToken: string | null) =>
    apiFetch<OrderLineRemoval>(`/order-line-removals/${removalId}/acknowledge`, {
      method: "POST",
      body: { reason },
      ...auth(accessToken),
    }),
};
