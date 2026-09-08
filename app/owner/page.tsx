"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { HomeToday } from "@/components/home/home-today";

export default function OwnerPage() {
  return (
    <AuthGuard requiredRole="OWNER">
      <AppShell title="Trading Console">
        <HomeToday />
      </AppShell>
    </AuthGuard>
  );
}
