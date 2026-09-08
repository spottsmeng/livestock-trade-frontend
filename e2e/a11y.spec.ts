import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginWithMfa, loginAsBuyer, BASE_URL } from "./helpers";

// §17.3 ("axe-core in CI on every page") and phase05-instructions.txt's
// explicit instruction to cover the WHOLE frontend, not just this phase's
// new screens. Reads the seeded dev accounts' MFA secrets from env (see
// README note below) rather than hard-coding them, since scripts/seed.py
// generates a fresh TOTP secret every time it runs.
//
// To run: BOBBY_MFA_SECRET=... BING_MFA_SECRET=... pnpm test:a11y
// (fetch the current values with, from backend/:
//   docker exec backend-postgres-1 psql -U livestock -d livestock -tAc \
//     "SELECT email, mfa_secret FROM users WHERE email IN ('bobby@example.com','bing@example.com');")
//
// One login per role, not per route: the real §14 login rate limiter
// (5/min) is deliberately not relaxed for this suite, so this authenticates
// once per describe block and walks every route within that same session —
// which is also just a faster, more realistic suite than re-authenticating
// per page.
const BOBBY_MFA_SECRET = process.env.BOBBY_MFA_SECRET ?? "";
const BING_MFA_SECRET = process.env.BING_MFA_SECRET ?? "";

const UNAUTHENTICATED_ROUTES = ["/login", "/accept-invite"];
const CONSOLE_ROUTES = [
  "/workbench",
  "/benchmark-compare",
  "/correction-requests",
  "/reference-data",
  "/buy-instructions",
  "/dashboard",
];
const BUYER_ROUTES = ["/buyer", "/buyer/bid-check", "/buyer/buy-log", "/buyer/instruction", "/buyer/scorecard"];

async function scanRoutes(page: import("@playwright/test").Page, routes: string[]) {
  const failures: string[] = [];
  for (const route of routes) {
    await test.step(route, async () => {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForLoadState("networkidle");
      // networkidle alone raced ahead of client-fetched content on a real
      // run (confirmed live: /users scanned mid-fetch, giving a false "0
      // violations" pass on its still-empty "Loading…" placeholder instead
      // of the real table). This codebase consistently renders that exact
      // string while a page's own useEffect fetch is in flight — wait for
      // it to clear, best-effort, so the scan always sees real content.
      await page
        .getByText("Loading…", { exact: true })
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {});
      const results = await new AxeBuilder({ page }).analyze();
      if (results.violations.length > 0) {
        failures.push(`${route}:\n${JSON.stringify(results.violations, null, 2)}`);
      }
    });
  }
  expect(failures, failures.join("\n\n")).toEqual([]);
}

test.describe("Unauthenticated screens", () => {
  test("every unauthenticated screen has zero axe violations", async ({ page }) => {
    await scanRoutes(page, UNAUTHENTICATED_ROUTES);
  });
});

test.describe("Trading Console (OWNER)", () => {
  test.skip(!BOBBY_MFA_SECRET, "BOBBY_MFA_SECRET not set — see this file's header comment");

  test("every OWNER-reachable console screen has zero axe violations", async ({ page }) => {
    await loginWithMfa(page, "bobby@example.com", BOBBY_MFA_SECRET);
    await scanRoutes(page, ["/owner", ...CONSOLE_ROUTES, "/users"]);

    // /workbench/[snapshotId] is a dense, dynamic-route screen the plain
    // route list above can't reach directly — needs a real snapshot id,
    // discovered from whatever the dev DB already has (per this phase's
    // own "check what's there before manufacturing new data" instruction).
    // Reuses this same already-authenticated session rather than logging
    // in again: a real run showed a second login's own /auth/me call
    // landing after the scan above had already pushed bobby's §14 general
    // rate-limit bucket past 100/min (real requests, correctly limited —
    // scanning 9+ data-heavy pages in well under a minute is exactly the
    // non-human-speed traffic that limit exists for), which silently
    // stranded the second login on /login. One continuous session avoids
    // that class of interaction entirely, and matches how a real user
    // would navigate anyway.
    await page.goto(`${BASE_URL}/workbench`);
    await page.waitForLoadState("networkidle");
    const firstSnapshotLink = page.locator('a[href^="/workbench/"]').first();
    const count = await firstSnapshotLink.count();
    if (count > 0) {
      await firstSnapshotLink.click();
      await page.waitForLoadState("networkidle");
      await page
        .getByText("Loading…", { exact: true })
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {});
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
    }
  });
});

test.describe("Trading Console (ACCOUNTANT)", () => {
  test.skip(!BING_MFA_SECRET, "BING_MFA_SECRET not set — see this file's header comment");

  test("/users redirects an ACCOUNTANT away, and every other screen has zero axe violations", async ({ page }) => {
    await loginWithMfa(page, "bing@example.com", BING_MFA_SECRET);

    await page.goto(`${BASE_URL}/users`);
    await expect(page).toHaveURL(/\/accountant/);

    await scanRoutes(page, ["/accountant", ...CONSOLE_ROUTES]);
  });
});

test.describe("Buyer PWA", () => {
  test("every buyer screen has zero axe violations", async ({ page }) => {
    await loginAsBuyer(page, "buyer@example.com");
    await scanRoutes(page, BUYER_ROUTES);
  });
});
