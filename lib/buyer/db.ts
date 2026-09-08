import Dexie, { type Table } from "dexie";
import type { BuyEntryCreatePayload, BuyEntryResponse, DnbpCurrentResponse } from "@/lib/buyer-api";

/**
 * §12.7's offline architecture, the three IndexedDB tables named in the
 * PRD's own architecture diagram (Dexie — MIT/FOSS). This is the only
 * source of truth the Bid Check and DNBP home screens read from; every
 * network fetch exists only to keep this cache fresh, never to answer a
 * render directly (§12.3 "works fully offline").
 */

const CURRENT_DNBP_KEY = "current";

export type CachedDnbp = DnbpCurrentResponse & { id: typeof CURRENT_DNBP_KEY; fetched_at: string };

export type SyncStatus = "queued" | "syncing" | "synced" | "conflict";

export type PendingEntry = {
  client_uuid: string;
  payload: BuyEntryCreatePayload;
  sync_status: SyncStatus;
  created_at: string;
  error_message?: string;
};

export type HistoryEntry = BuyEntryResponse;

class BuyerDatabase extends Dexie {
  dnbp_cache!: Table<CachedDnbp, string>;
  pending_entries!: Table<PendingEntry, string>;
  entry_history!: Table<HistoryEntry, string>;

  constructor() {
    super("livestock-buyer");
    this.version(1).stores({
      dnbp_cache: "id",
      pending_entries: "client_uuid, sync_status, created_at",
      entry_history: "client_uuid, trade_date, species, client_created_at",
    });
  }
}

export const buyerDb = new BuyerDatabase();

export async function cacheDnbp(current: DnbpCurrentResponse): Promise<void> {
  await buyerDb.dnbp_cache.put({ ...current, id: CURRENT_DNBP_KEY, fetched_at: new Date().toISOString() });
}

export async function getCachedDnbp(): Promise<CachedDnbp | undefined> {
  return buyerDb.dnbp_cache.get(CURRENT_DNBP_KEY);
}

export async function queueEntry(payload: BuyEntryCreatePayload): Promise<void> {
  await buyerDb.pending_entries.put({
    client_uuid: payload.client_uuid,
    payload,
    sync_status: "queued",
    created_at: new Date().toISOString(),
  });
}

export async function cacheHistoryEntry(entry: BuyEntryResponse): Promise<void> {
  await buyerDb.entry_history.put(entry);
}

export async function recentHistory(limit = 50): Promise<HistoryEntry[]> {
  return buyerDb.entry_history.orderBy("client_created_at").reverse().limit(limit).toArray();
}
