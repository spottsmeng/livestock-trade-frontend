import { create } from "zustand";

const STORAGE_KEY = "livestock-onboarding-tooltips";

/** Same localStorage-with-try/catch idiom as components/theme-toggle.tsx —
 * private-browsing contexts can throw, and falling back to "on" (the new
 * business user default) is the safe choice either way. */
export function readStoredOnboardingPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "off") return false;
    if (stored === "on") return true;
  } catch {
    // localStorage can throw in private-browsing contexts; default to visible.
  }
  return true;
}

type OnboardingState = {
  tooltipsEnabled: boolean;
  setTooltipsEnabled: (enabled: boolean) => void;
};

// Starts "on" unconditionally (rather than reading storage in the module
// initializer) so server-rendered HTML and the client's first render always
// agree — components/onboarding-hydrator.tsx corrects this to the real
// stored value right after mount, same one-time-mismatch trade-off
// components/theme-toggle.tsx already makes for the same reason.
export const useOnboardingStore = create<OnboardingState>((set) => ({
  tooltipsEnabled: true,
  setTooltipsEnabled(enabled) {
    set({ tooltipsEnabled: enabled });
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
    } catch {
      // Best-effort only — the toggle still works for this page view.
    }
  },
}));
