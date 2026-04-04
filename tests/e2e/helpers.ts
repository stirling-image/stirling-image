import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// login() — fill the login form and submit (for tests that need fresh login)
// ---------------------------------------------------------------------------
export async function login(page: Page, username = "admin", password = "admin") {
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("/", { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// createTestImageFile() — create a small test PNG on disk and return its path
// ---------------------------------------------------------------------------
let _testImagePath: string | null = null;

export function getTestImagePath(): string {
  if (_testImagePath && fs.existsSync(_testImagePath)) return _testImagePath;

  const dir = path.join(process.cwd(), "test-results");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _testImagePath = path.join(dir, "test-image.png");

  try {
    const script = [
      "const sharp = require('sharp');",
      `sharp({create:{width:100,height:100,channels:4,background:{r:255,g:0,b:0,alpha:1}}}).png().toFile('${_testImagePath.replace(/'/g, "\\'")}')`,
    ].join(" ");
    execFileSync("node", ["-e", script], {
      cwd: process.cwd(),
      timeout: 5000,
    });
  } catch {
    // Fallback: write a minimal 1x1 PNG manually
    const minimalPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==",
      "base64",
    );
    fs.writeFileSync(_testImagePath, minimalPng);
  }

  return _testImagePath;
}

// ---------------------------------------------------------------------------
// getTestHeicPath() — return a small HEIC test image (from fixtures)
// ---------------------------------------------------------------------------
export function getTestHeicPath(): string {
  return path.join(process.cwd(), "tests", "fixtures", "test-200x150.heic");
}

// ---------------------------------------------------------------------------
// uploadTestImage() — upload a test image via the file chooser on a tool page
// ---------------------------------------------------------------------------
export async function uploadTestImage(page: Page): Promise<void> {
  const testImagePath = getTestImagePath();

  const fileChooserPromise = page.waitForEvent("filechooser");
  const dropzone = page.locator("[class*='border-dashed']").first();
  await dropzone.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testImagePath);

  // Wait for React state to update
  await page.waitForTimeout(500);
}

// ---------------------------------------------------------------------------
// waitForProcessing() — wait for processing to complete
// ---------------------------------------------------------------------------
export async function waitForProcessing(page: Page, timeoutMs = 30_000) {
  try {
    const spinner = page.locator("[class*='animate-spin']");
    if (await spinner.isVisible({ timeout: 2000 })) {
      await spinner.waitFor({ state: "hidden", timeout: timeoutMs });
    }
  } catch {
    // No spinner appeared — processing may have been instant
  }
}

// ---------------------------------------------------------------------------
// Custom test fixture — loggedInPage uses the saved storageState
// (all "chromium" project tests already have auth via storageState,
//  but this provides backward compatibility for tests that use it)
// ---------------------------------------------------------------------------
export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    // storageState is already loaded by the project config, just navigate
    await page.goto("/");
    await use(page);
  },
});

export { expect };
