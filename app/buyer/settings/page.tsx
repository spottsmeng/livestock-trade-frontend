"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { BuyerBottomNav } from "@/components/buyer/bottom-nav";
import { OnboardingTooltipsSetting } from "@/components/settings/onboarding-tooltips-setting";
import { strings } from "@/lib/strings";

export default function BuyerSettingsPage() {
  return (
    <AuthGuard requiredRole="BUYER">
      <AppShell title={strings.settings.title}>
        <div className="flex flex-col gap-4 p-4">
          <OnboardingTooltipsSetting />
        </div>
      </AppShell>
      <BuyerBottomNav />
    </AuthGuard>
  );
}
