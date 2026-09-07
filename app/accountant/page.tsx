"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { strings } from "@/lib/strings";

export default function AccountantPage() {
  return (
    <AuthGuard requiredRole="ACCOUNTANT">
      <AppShell title="Trading Console">
        <EmptyState title={strings.shell.emptyState.title} body={strings.shell.emptyState.body} />
      </AppShell>
    </AuthGuard>
  );
}
