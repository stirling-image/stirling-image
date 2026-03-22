import { test as setup, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const authFile = path.join(
  process.cwd(),
  "test-results",
  ".auth",
  "user.json",
);

setup("authenticate", async ({ page }) => {
  // Ensure directory exists
  const dir = path.dirname(authFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  await page.goto("/login");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: /login/i }).click();

  // Wait for the full-page redirect to "/"
  await page.waitForURL("/", { timeout: 15_000 });
  await expect(page).toHaveURL("/");

  // Save storage state (includes localStorage with the token)
  await page.context().storageState({ path: authFile });
});
