"use client";

import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { HomeToday } from "@/components/home/home-today";

export default function AccountantPage() {
  return (
    <AuthGuard requiredRole="ACCOUNTANT">
      <AppShell title="Trading Console">
        <HomeToday />
      </AppShell>
    </AuthGuard>
  );
}
