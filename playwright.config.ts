import { defineConfig } from "@playwright/test";

// §17.3/§6 of Phase 5's plan — axe-core wired into a real, checked-in
// suite (not ad hoc, scratchpad-only Playwright the way Phases 3/3b/4 used
// it). Assumes the backend (localhost:8000) and its docker-compose
// Postgres/Redis are already running with the seed data
// backend/scripts/seed.py produces — this suite doesn't start them itself,
// the same "point at an already-running dev stack" assumption
// start-servers-command.txt documents for manual smoke testing.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // shares one seeded set of accounts/DB state across tests
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
