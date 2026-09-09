"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { CorrectionRequestsList } from "@/components/correction-requests/correction-requests-list";
import { OrderLineRemovalsPanel } from "@/components/correction-requests/order-line-removals-panel";
import { strings } from "@/lib/strings";

export default function CorrectionRequestsPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.correctionRequests.title}>
        <p className="mb-4 text-sm text-fg-secondary">{strings.correctionRequests.subtitle}</p>
        <div className="flex flex-col gap-6">
          <OrderLineRemovalsPanel />
          <CorrectionRequestsList />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
