"use client";

import * as React from "react";
import { readStoredOnboardingPreference, useOnboardingStore } from "@/lib/onboarding-store";

/** Mounted once in the root layout, next to Toaster/SentryInit. Pulls the
 * real stored preference in after mount so the server-rendered (and first
 * client render) pass always matches with tooltips shown — see
 * lib/onboarding-store.ts for why the store itself can't just read
 * localStorage at creation time. */
export function OnboardingHydrator() {
  React.useEffect(() => {
    const stored = readStoredOnboardingPreference();
    if (stored !== useOnboardingStore.getState().tooltipsEnabled) {
      useOnboardingStore.setState({ tooltipsEnabled: stored });
    }
  }, []);
  return null;
}
