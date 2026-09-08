"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { type Snapshot, type UploadPreview, workbenchApi } from "@/lib/workbench-api";

export default function WorkbenchListPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title="Order Workbench">
        <WorkbenchListContent />
      </AppShell>
    </AuthGuard>
  );
}

function WorkbenchListContent() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [snapshots, setSnapshots] = React.useState<Snapshot[]>([]);
  const [preview, setPreview] = React.useState<UploadPreview | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  // Starts true (first paint is always "loading") rather than being set
  // synchronously inside the effect below — only the async continuation
  // (after the awaited fetch) ever calls setLoading(false).
  const [loading, setLoading] = React.useState(true);

  const loadSnapshots = React.useCallback(async () => {
    try {
      setSnapshots(await workbenchApi.listSnapshots(accessToken));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  async function handlePreview() {
    if (!file) return;
    setBusy(true);
    try {
      setPreview(await workbenchApi.uploadPreview(file, accessToken));
    } catch {
      toast({ title: "Could not parse this file", variant: "danger" });
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirm() {
    if (!preview) return;
    setBusy(true);
    try {
      const snapshot = await workbenchApi.commitSnapshot(preview.preview_id, accessToken);
      await workbenchApi.calculateSnapshot(snapshot.id, accessToken);
      toast({ title: "Snapshot committed and calculated" });
      setPreview(null);
      setFile(null);
      await loadSnapshots();
    } catch {
      toast({ title: "Could not commit this snapshot", variant: "danger" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-lg font-semibold text-fg-primary">Upload Active Purchase Orders</h2>
        <p className="mt-1 text-sm text-fg-secondary">
          Available to both Owner and Accountant (§11.2) — whoever the abattoir&apos;s email reaches. The diff against the
          previous snapshot is shown before anything is committed.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreview(null);
            }}
            className="text-sm text-fg-primary"
          />
          <Button size="sm" onClick={handlePreview} disabled={!file || busy}>
            {busy && !preview ? "Parsing…" : "Preview"}
          </Button>
        </div>

        {preview ? (
          <div className="mt-4 rounded-md border border-default bg-sunken p-4">
            <p className="text-sm text-fg-primary">
              Detected layout: <span className="font-medium">{String(preview.detected_layout.strategy)}</span>
            </p>
            <p className="mt-1 text-sm text-fg-secondary">
              {preview.active_count} active · {preview.loaded_count} loaded
            </p>
            <p className="mt-1 text-sm text-fg-secondary">
              vs previous snapshot: ✚ {preview.diff.summary.new_count} new · ✎ {preview.diff.summary.changed_count} changed ·
              → {preview.diff.summary.moved_to_loaded_count} moved to loaded · ⊘ {preview.diff.summary.removed_count} removed
            </p>
            <Button size="sm" className="mt-3" onClick={handleConfirm} disabled={busy}>
              {busy ? "Committing…" : "Confirm and commit"}
            </Button>
          </div>
        ) : null}
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-fg-primary">Snapshots</h2>
        {loading ? (
          <p className="text-sm text-fg-tertiary">Loading…</p>
        ) : snapshots.length === 0 ? (
          <EmptyState title="No snapshots yet" body="Upload the Active Purchase Orders workbook to get started." />
        ) : (
          <div className="flex flex-col gap-2">
            {snapshots.map((snapshot) => (
              <Link
                key={snapshot.id}
                href={`/workbench/${snapshot.id}`}
                className="flex items-center justify-between rounded-md border border-subtle bg-surface p-4 hover:border-default"
              >
                <div>
                  <p className="text-sm font-medium text-fg-primary">{snapshot.source_filename}</p>
                  <p className="text-xs text-fg-tertiary">{new Date(snapshot.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={snapshot.status === "CALCULATED" ? "pass" : "neutral"}>{snapshot.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
