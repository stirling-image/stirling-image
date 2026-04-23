import path from "node:path";
import { expect, test as setup } from "@playwright/test";

const authFile =
  // Support both playwright.docker.config and playwright.analytics.config
  path.join(__dirname, "..", "..", "test-results", ".auth", "analytics-user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: /login/i }).click();

  // After login, may land on "/" or "/analytics-consent" (fresh user)
  await page.waitForURL(/\/(analytics-consent)?$/, { timeout: 30_000 });

  // If redirected to consent page, accept analytics to proceed
  if (page.url().includes("/analytics-consent")) {
    await page.getByRole("button", { name: /sure, sounds good/i }).click();
    await page.waitForURL("/", { timeout: 15_000 });
  }

  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: authFile });
});
