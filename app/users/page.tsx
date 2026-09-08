"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { UsersTable } from "@/components/users/users-table";
import { strings } from "@/lib/strings";

export default function UsersPage() {
  return (
    <AuthGuard requiredRole="OWNER">
      <AppShell title={strings.users.title}>
        <UsersTable />
      </AppShell>
    </AuthGuard>
  );
}
