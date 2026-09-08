"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** §12.7 — "Installable PWA". Chromium/Android exposes
 * `beforeinstallprompt`; iOS Safari has no such event (install is via the
 * Share sheet), so this banner simply never appears there — that platform
 * gap is inherent to iOS, not something this component can paper over. */
export function InstallPrompt() {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-default bg-sunken px-4 py-2 text-sm">
      <span className="text-fg-secondary">{strings.buyer.install.prompt}</span>
      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          {strings.buyer.install.install}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          {strings.buyer.install.dismiss}
        </Button>
      </div>
    </div>
  );
}
