"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { strings } from "@/lib/strings";

export default function OwnerPage() {
  return (
    <AuthGuard requiredRole="OWNER">
      <AppShell title="Trading Console">
        <EmptyState title={strings.shell.emptyState.title} body={strings.shell.emptyState.body}>
          <Button asChild size="sm" className="mt-2">
            <Link href="/workbench">Go to Order Workbench</Link>
          </Button>
        </EmptyState>
      </AppShell>
    </AuthGuard>
  );
}
