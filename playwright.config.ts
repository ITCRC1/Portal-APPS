import { defineConfig, devices } from "@playwright/test"

// Suite de autorización (RBAC + aislamiento por departamento). Corre contra un
// servidor Next real y la base de DATABASE_URL. Un solo worker para evitar carreras
// sobre la base compartida; los datos se siembran/borran en global setup/teardown.
export default defineConfig({
  testDir: "./tests/authz",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/authz/global-setup.ts",
  globalTeardown: "./tests/authz/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
