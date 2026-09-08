import type { Page } from "@playwright/test";
import { totpNow } from "./totp";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const DEV_PASSWORD = "ChangeMe123!Dev"; // matches backend/scripts/seed.py's DEV_PASSWORD — dev/CI seed only

async function submitLogin(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

/** OWNER/ACCOUNTANT both require TOTP in a real deployment (§14 — defaults
 * `mfa_enforcement_enabled: true`). This dev environment's own .env sets
 * it false (core/config.py's documented "skip entering a code on every
 * login while the product is still being built out" escape hatch), so
 * this helper handles both: submit email+password, then race whichever
 * happens first — the TOTP field appearing (enforcement on) or navigation
 * already completing (enforcement off) — rather than assuming either. The
 * seeded accounts' MFA secrets are read from the real dev DB (docker exec
 * ... SELECT mfa_secret), not hard-coded, since scripts/seed.py generates
 * a fresh one each time it runs. Passed in by the caller/env rather than
 * queried here so this helper has no direct DB dependency. */
export async function loginWithMfa(page: Page, email: string, mfaSecret: string) {
  await submitLogin(page, email, DEV_PASSWORD);

  // Generous timeouts: Next dev's on-demand (Turbopack) compilation of a
  // not-yet-visited route can genuinely take several seconds on first hit,
  // independent of the login itself — this raced too tight originally and
  // produced intermittent failures unrelated to either auth or a11y.
  const totpField = page.getByLabel(/authenticator code/i);
  const result = await Promise.race([
    totpField.waitFor({ state: "visible", timeout: 20000 }).then(() => "mfa" as const),
    page.waitForURL(/\/(owner|accountant)/, { timeout: 20000 }).then(() => "done" as const),
  ]).catch(() => "timeout" as const);

  if (result === "mfa") {
    await totpField.fill(totpNow(mfaSecret));
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(owner|accountant)/, { timeout: 20000 });
  } else if (result === "timeout") {
    throw new Error(`Login for ${email} neither revealed the TOTP field nor navigated away from /login.`);
  }
}

export async function loginAsBuyer(page: Page, email: string) {
  await submitLogin(page, email, DEV_PASSWORD);
  await page.waitForURL(/\/buyer/, { timeout: 10000 });
}

export { BASE_URL, DEV_PASSWORD };
