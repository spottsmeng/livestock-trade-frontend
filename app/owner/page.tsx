"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { strings } from "@/lib/strings";

export default function OwnerPage() {
  return (
    <AuthGuard requiredRole="OWNER">
      <AppShell title="Trading Console">
        <EmptyState title={strings.shell.emptyState.title} body={strings.shell.emptyState.body} />
      </AppShell>
    </AuthGuard>
  );
}
