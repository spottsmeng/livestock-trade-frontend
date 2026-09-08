import { apiFetch } from "./api-client";
import { TicketSocket } from "./ws-client";

export type PublicationLine = {
  id: string;
  publication_id: string;
  species: string;
  dnbp_per_kg: string;
  target_heads: string | null;
  target_weight_kg_min: string | null;
  target_weight_kg_max: string | null;
  contributing_line_ids: string[];
};

export type DeliveryState = {
  buyer_id: string;
  buyer_email: string;
  delivered_at: string | null;
  acknowledged_at: string | null;
  channel: string | null;
  is_overdue: boolean;
  escalated_at: string | null;
};

export type Publication = {
  id: string;
  org_id: string;
  snapshot_id: string;
  published_by: string;
  published_at: string;
  effective_from: string;
  engine_version: string;
  notes: string | null;
  superseded_by: string | null;
  superseded_at: string | null;
  lines: PublicationLine[];
};

export type PublicationDetail = Publication & { deliveries: DeliveryState[] };

function auth(accessToken: string | null) {
  return { accessToken };
}

export const publicationsApi = {
  publish: (snapshotId: string, notes: string | undefined, accessToken: string | null) =>
    apiFetch<PublicationDetail>("/publications", {
      method: "POST",
      body: { snapshot_id: snapshotId, notes },
      ...auth(accessToken),
    }),

  list: (accessToken: string | null) => apiFetch<Publication[]>("/publications", auth(accessToken)),

  getCurrent: (accessToken: string | null) => apiFetch<PublicationDetail>("/publications/current", auth(accessToken)),

  get: (id: string, accessToken: string | null) => apiFetch<PublicationDetail>(`/publications/${id}`, auth(accessToken)),

  acknowledgeIssue: (snapshotId: string, issueId: string, accessToken: string | null) =>
    apiFetch<unknown>(`/snapshots/${snapshotId}/issues/${issueId}/acknowledge`, { method: "POST", ...auth(accessToken) }),

  getWsTicket: (accessToken: string | null) => apiFetch<{ ticket: string }>("/ws/ticket", { method: "POST", ...auth(accessToken) }),
};

/** §9.9/§10/§11.5 — the console's live delivery tracker. */
export function connectConsoleSocket(
  getAccessToken: () => string | null,
  onEvent: (event: string, data: unknown) => void,
  onReconnect: () => void
): TicketSocket {
  const socket = new TicketSocket(
    "/ws/console",
    async () => (await publicationsApi.getWsTicket(getAccessToken())).ticket,
    onEvent,
    onReconnect
  );
  void socket.connect();
  return socket;
}
