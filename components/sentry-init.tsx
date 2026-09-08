"use client";

import * as React from "react";

/**
 * §16 — "Sentry on both tiers," client-SDK-only, disabled unless a DSN is
 * configured (see [[foss-only-software-stack]]: sentry.io's hosted SaaS is
 * proprietary and out of scope for what's *deployed*; @sentry/browser
 * itself is an MIT-licensed client SDK, fine regardless of what it talks
 * to). Point NEXT_PUBLIC_SENTRY_DSN at a self-hosted, FOSS-licensed target
 * in production — self-hosted Sentry (FSL, free to self-host) or GlitchTip
 * (AGPL) — never at sentry.io.
 *
 * Deliberately the plain @sentry/browser SDK, not @sentry/nextjs: the
 * Next.js SDK's install wizard rewrites next.config.ts and adds build-time
 * source-map upload requiring a SENTRY_AUTH_TOKEN, both riskier to get
 * right in this session without a real Sentry-compatible endpoint to test
 * against. This is simpler, carries the same FOSS/client-SDK-only
 * guarantee, and avoids build-pipeline changes.
 */
export function SentryInit() {
  React.useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) return;
    void import("@sentry/browser").then(({ init }) => {
      init({ dsn, sendDefaultPii: false });
    });
  }, []);

  return null;
}
