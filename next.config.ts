import type { NextConfig } from "next";

// §14 — "HTTPS only, HSTS, strict CSP, no inline scripts." No nonces: this
// app has no need to selectively allow specific inline scripts, and nonces
// would force every page into dynamic rendering (killing static
// optimization on 18+ of this app's routes) — a real architectural cost
// disproportionate to what this phase needs. Instead this follows Next's
// own CSP guide's "Without Nonces" pattern exactly
// (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
// — INCLUDING that pattern's `script-src 'self' 'unsafe-inline'`.
//
// That inline allowance is not this app's own doing: grepped the whole
// frontend first and found zero <script> tags or dangerouslySetInnerHTML
// anywhere in application code. But actually loading the app with a
// stricter `script-src 'self'` (no unsafe-inline) in a real headless
// browser — not just curl, per this phase's own "verify with the CSP
// active, don't just write the header and hope" instruction — surfaced a
// real, concrete failure: Next.js App Router's own RSC hydration payload
// ships as inline <script>self.__next_f.push(...)</script> tags on every
// page load, which a strict script-src silently blocked, breaking
// hydration entirely (confirmed via a real page load: "Invariant: Expected
// a request ID to be defined for the document via self.__next_r" — a
// Next.js-internal failure, not an application bug). So 'unsafe-inline' on
// script-src here is Next.js's own framework requirement in its
// no-nonce/no-SRI configuration, not a relaxation of this app's own code.
// style-src separately allows 'unsafe-inline' for the one real inline
// `style={{...}}` prop this app has (app/buyer/page.tsx's tabular-nums
// feature setting), which React renders as an HTML style="" attribute.
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const WS_ORIGIN = API_ORIGIN.replace(/^http/, "ws");
const isDev = process.env.NODE_ENV === "development";

// components/sentry-init.tsx's SDK reports to this origin when configured
// — connect-src must allow it too, or the CSP would silently block
// Sentry's own error reports the moment a real DSN is set.
const SENTRY_ORIGIN = process.env.NEXT_PUBLIC_SENTRY_DSN ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin : "";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self' data:;
  connect-src 'self' ${API_ORIGIN} ${WS_ORIGIN}${SENTRY_ORIGIN ? ` ${SENTRY_ORIGIN}` : ""};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspHeader },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
