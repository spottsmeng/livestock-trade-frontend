import type { MarketObservationCreatePayload } from "@/lib/market-intel-api";
import { queueObservation } from "@/lib/buyer/db";
import { flushPendingObservations } from "@/lib/buyer/sync-observations";

/**
 * The Market Intel screen's one write path, mirroring lib/buyer/create-
 * entry.ts's submitBuyEntry: always queue first (works fully offline),
 * then make a best-effort immediate flush attempt. The entry is durably
 * queued either way — the retry loop in sync-observations.ts eventually
 * lands it.
 */
export async function submitObservation(
  payload: Omit<MarketObservationCreatePayload, "client_uuid" | "client_created_at">,
  accessToken: string | null
): Promise<void> {
  const full: MarketObservationCreatePayload = {
    ...payload,
    client_uuid: crypto.randomUUID(),
    client_created_at: new Date().toISOString(),
  };
  await queueObservation(full);
  void flushPendingObservations(accessToken);
}
