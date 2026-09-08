"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { BenchmarkCompareView } from "@/components/benchmark-compare/benchmark-compare-view";
import { strings } from "@/lib/strings";

export default function BenchmarkComparePage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.benchmarkCompare.title}>
        <p className="mb-4 text-sm text-fg-secondary">{strings.benchmarkCompare.subtitle}</p>
        <BenchmarkCompareView />
      </AppShell>
    </AuthGuard>
  );
}
