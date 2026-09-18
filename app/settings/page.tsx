"use client";

import { AppShell } from "@/components/app-shell";
import { AuthGuard } from "@/components/auth-guard";
import { OnboardingTooltipsSetting } from "@/components/settings/onboarding-tooltips-setting";
import { strings } from "@/lib/strings";

export default function SettingsPage() {
  return (
    <AuthGuard requiredRole={["OWNER", "ACCOUNTANT"]}>
      <AppShell title={strings.settings.title}>
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
          <OnboardingTooltipsSetting />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
