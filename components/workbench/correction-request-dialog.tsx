"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { useAuthStore } from "@/lib/auth-store";
import { workbenchApi } from "@/lib/workbench-api";

/**
 * §2.1.1, §9.3, §11.3/§11.6 — the ONLY action available on a received
 * (A-V) cell. Raising a request never edits the cell and never contacts
 * the abattoir; it is purely an internal flag Bing/Bobby resolve by phone
 * or email outside this product.
 */
export function CorrectionRequestDialog({
  orderLineId,
  columnRef,
  issueCode,
  open,
  onOpenChange,
  onRaised,
}: {
  orderLineId: string;
  columnRef: string;
  issueCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRaised: () => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [detail, setDetail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await workbenchApi.raiseCorrectionRequest(orderLineId, { column_ref: columnRef, issue_code: issueCode, detail }, accessToken);
      toast({ title: "Correction request raised", description: `Flagged ${columnRef} for follow-up with the abattoir.` });
      setDetail("");
      onOpenChange(false);
      onRaised();
    } catch {
      toast({ title: "Could not raise correction request", variant: "danger" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Request a correction</DialogTitle>
        <DialogDescription>
          Column <span className="font-semibold text-fg-primary">{columnRef}</span> is abattoir-owned data — this
          flags it for Bing or Bobby to resolve with the abattoir directly. It never edits the value here and never
          contacts the abattoir from this product.
        </DialogDescription>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <div>
            <Label htmlFor="detail">Detail (optional)</Label>
            <Input id="detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. missing on this submission" />
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Raising…" : "Raise correction request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
