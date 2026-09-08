import type { BuyEntryCreatePayload } from "@/lib/buyer-api";
import { queueEntry } from "@/lib/buyer/db";
import { flushPendingEntries } from "@/lib/buyer/sync";

/**
 * The one write path both the Buy Log screen and Bid Check's "Log this buy"
 * action go through (§12.3, §12.4): always queue first (§12.7 — the app
 * must work fully offline), then make a best-effort immediate flush
 * attempt. Whether that immediate attempt succeeds or not, the entry is
 * already durably queued and the retry loop in lib/buyer/sync.ts will
 * eventually land it.
 */
export async function submitBuyEntry(
  payload: Omit<BuyEntryCreatePayload, "client_uuid" | "client_created_at">,
  accessToken: string | null
): Promise<void> {
  const full: BuyEntryCreatePayload = {
    ...payload,
    client_uuid: crypto.randomUUID(),
    client_created_at: new Date().toISOString(),
  };
  await queueEntry(full);
  void flushPendingEntries(accessToken);
}
