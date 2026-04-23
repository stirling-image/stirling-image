import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const authFile = path.join(__dirname, "test-results", ".auth", "analytics-user.json");

const baseURL = process.env.BASE_URL ?? "http://localhost:1349";
process.env.API_URL ??= baseURL;

export default defineConfig({
  testDir: "./tests/e2e-docker",
  timeout: 120_000,
  expect: {
    timeout: 30_000,
  },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
  ],
});

export { authFile };
