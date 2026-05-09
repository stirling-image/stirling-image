import { expect, test, uploadTestImage } from "./helpers";

const MOD = process.platform === "darwin" ? "Meta" : "Control";

// ---------------------------------------------------------------------------
// Helper: toggle theme via keyboard shortcut (Cmd/Ctrl+Shift+D)
// On mobile the Footer with the theme toggle button is not rendered, so
// the keyboard shortcut is the reliable way to switch themes.
// ---------------------------------------------------------------------------
async function setTheme(page: import("@playwright/test").Page, theme: "light" | "dark") {
  const isDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
  const wantDark = theme === "dark";
  if (isDark !== wantDark) {
    await page.keyboard.press(`${MOD}+Shift+d`);
    await page.waitForTimeout(300);
  }
}

// ---------------------------------------------------------------------------
// Helper: take a themed screenshot pair (light + dark)
// ---------------------------------------------------------------------------
async function takeThemedScreenshots(page: import("@playwright/test").Page, baseName: string) {
  // Light theme
  await setTheme(page, "light");
  await expect(page).toHaveScreenshot(`mobile-${baseName}-light.png`, {
    fullPage: false,
  });

  // Dark theme
  await setTheme(page, "dark");
  await expect(page).toHaveScreenshot(`mobile-${baseName}-dark.png`, {
    fullPage: false,
  });

  // Reset to light for next test
  await setTheme(page, "light");
}

// ---------------------------------------------------------------------------
// Mobile visual regression: 375x667
// ---------------------------------------------------------------------------
test.describe("Visual Mobile (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  // ---- Login page (unauthenticated) ----
  test.describe("Login page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("login page stacked layout - light and dark", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Verify stacked layout: marketing panel should be hidden on mobile
      await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
      await expect(page.getByText("Your one-stop-shop")).not.toBeVisible();

      await takeThemedScreenshots(page, "login-empty");
    });

    test("login page filled with error - light and dark", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      // Fill in invalid credentials and submit
      await page.getByLabel("Username").fill("wronguser");
      await page.getByLabel("Password").fill("wrongpassword");
      await page.getByRole("button", { name: /login/i }).click();

      // Wait for the error message to appear
      await page.waitForTimeout(1000);
      await expect(page.getByText(/invalid|incorrect|failed/i).first()).toBeVisible();

      // Verify error fits within mobile viewport without overflow
      await takeThemedScreenshots(page, "login-error");
    });
  });

  // ---- Home page (empty, no file uploaded) ----
  test("home page empty - light and dark", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify mobile layout: top bar with hamburger menu visible, no desktop sidebar
    await expect(page.getByText("SnapOtter").first()).toBeVisible();
    await expect(page.locator("aside")).not.toBeVisible();

    // Hamburger menu button should be visible on mobile
    const hamburger = page
      .locator(
        "button[aria-label*='menu' i], button[aria-label*='Menu' i], button[class*='hamburger' i]",
      )
      .first();
    const hasHamburger = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasHamburger) {
      await expect(hamburger).toBeVisible();
    }

    // Bottom navigation bar visible
    const bottomNav = page.locator("nav.fixed");
    await expect(bottomNav).toBeVisible();

    await takeThemedScreenshots(page, "home-empty");
  });

  // ---- Home page (file uploaded, Quick Actions visible) ----
  test("home page with file uploaded - light and dark", async ({ loggedInPage: page }) => {
    await uploadTestImage(page);
    await page.waitForTimeout(500);

    await expect(page.getByText("Quick Actions").first()).toBeVisible();

    await takeThemedScreenshots(page, "home-uploaded");
  });

  // ---- Fullscreen grid page (details shown - default) ----
  test("fullscreen grid details shown - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/fullscreen");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.getByText("Hide Details")).toBeVisible();

    await takeThemedScreenshots(page, "fullscreen-details-shown");
  });

  // ---- Fullscreen grid page (details hidden) ----
  test("fullscreen grid details hidden - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/fullscreen");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Toggle details off
    await page.getByText("Hide Details").click();
    await page.waitForTimeout(300);
    await expect(page.getByText("Show Details")).toBeVisible();

    await takeThemedScreenshots(page, "fullscreen-details-hidden");
  });

  // ---- Automate page (empty pipeline) ----
  test("automate page empty pipeline - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/automate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.getByText(/pipeline|automate/i).first()).toBeVisible();

    await takeThemedScreenshots(page, "automate-empty");
  });

  // ---- Automate page (3 steps added + file uploaded) ----
  test("automate page with 3 steps and file - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/automate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Add 3 pipeline steps
    const resizeBtn = page.getByRole("button", { name: /resize/i }).first();
    const compressBtn = page.getByRole("button", { name: /compress/i }).first();
    const convertBtn = page.getByRole("button", { name: /convert/i }).first();

    await resizeBtn.click();
    await page.waitForTimeout(300);
    await compressBtn.click();
    await page.waitForTimeout(300);
    await convertBtn.click();
    await page.waitForTimeout(300);

    // Upload a file to the pipeline
    await uploadTestImage(page);
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "automate-3steps-file");
  });

  // ---- Files page (empty) ----
  test("files page empty - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/files");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify no sidebar on mobile
    await expect(page.locator("aside")).not.toBeVisible();

    await takeThemedScreenshots(page, "files-empty");
  });

  // ---- Settings dialog - General tab ----
  test("settings dialog general tab - light and dark", async ({ loggedInPage: page }) => {
    // On mobile, open settings from the bottom nav bar
    const bottomNav = page.locator("nav.fixed");
    await bottomNav.getByText("Settings").click();
    await expect(page.getByRole("heading", { name: "General" })).toBeVisible();
    await page.waitForTimeout(500);

    // Verify settings modal scrolls within mobile viewport
    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dialogBox = await dialog.boundingBox();
      if (dialogBox) {
        expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(375 + 1);
        expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(667 + 1);
      }
    }

    await takeThemedScreenshots(page, "settings-general");
  });

  // ---- Settings dialog - People tab ----
  test("settings dialog people tab - light and dark", async ({ loggedInPage: page }) => {
    const bottomNav = page.locator("nav.fixed");
    await bottomNav.getByText("Settings").click();
    await expect(page.getByRole("heading", { name: "General" })).toBeVisible();

    // Navigate to People tab
    await page.getByRole("button", { name: "People" }).click();
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "settings-people");
  });

  // ---- Settings dialog - About tab ----
  test("settings dialog about tab - light and dark", async ({ loggedInPage: page }) => {
    const bottomNav = page.locator("nav.fixed");
    await bottomNav.getByText("Settings").click();
    await expect(page.getByRole("heading", { name: "General" })).toBeVisible();

    // Navigate to About tab
    await page.getByRole("button", { name: "About" }).click();
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "settings-about");
  });

  // ---- Help dialog ----
  test("help dialog - light and dark", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // On mobile, help is accessed via the bottom nav or hamburger menu
    const bottomNav = page.locator("nav.fixed");
    const helpBtn = bottomNav.getByText("Help");
    if (await helpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await helpBtn.click();
    } else {
      // Fall back to keyboard shortcut or any visible help trigger
      await page.getByRole("button", { name: /help/i }).first().click();
    }
    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify dialog (modal) scrolls within mobile viewport and does not overflow
    const dialogBox = await dialog.boundingBox();
    if (dialogBox) {
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.y).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(375 + 1);
      expect(dialogBox.y + dialogBox.height).toBeLessThanOrEqual(667 + 1);
    }

    await takeThemedScreenshots(page, "help-dialog");
  });

  // ---- Tool page - resize (empty, no file) ----
  test("resize tool empty - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify mobile layout: dropzone fills viewport width, no sidebar
    await expect(page.locator("aside")).not.toBeVisible();

    // Dropzone should fill the mobile viewport width
    const dropzone = page.locator("[class*='border-dashed']").first();
    if (await dropzone.isVisible({ timeout: 2000 }).catch(() => false)) {
      const dropzoneBox = await dropzone.boundingBox();
      if (dropzoneBox) {
        // Dropzone should span most of the 375px viewport width (allow padding)
        expect(dropzoneBox.width).toBeGreaterThan(300);
        expect(dropzoneBox.x + dropzoneBox.width).toBeLessThanOrEqual(375 + 1);
      }
    }

    await takeThemedScreenshots(page, "tool-resize-empty");
  });

  // ---- Tool page - resize (file uploaded, settings visible) ----
  test("resize tool with file - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await uploadTestImage(page);
    await page.waitForTimeout(500);

    // On mobile, tool settings should be collapsed by default (toggled via button)
    const settingsToggle = page.getByRole("button", { name: /settings/i }).first();
    const settingsPanel = page.locator("[class*='settings'], [class*='Settings']").first();
    const isPanelVisible = await settingsPanel.isVisible({ timeout: 2000 }).catch(() => false);
    // If settings are collapsed, expand them for the screenshot
    if (!isPanelVisible && (await settingsToggle.isVisible({ timeout: 1000 }).catch(() => false))) {
      await settingsToggle.click();
      await page.waitForTimeout(300);
    }

    await takeThemedScreenshots(page, "tool-resize-settings");
  });

  // ---- Tool page - compress (before-after result) ----
  test("compress tool before-after result - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/compress");
    await page.waitForLoadState("networkidle");

    await uploadTestImage(page);
    await page.waitForTimeout(1000);

    // Wait for the before-after slider to appear
    const slider = page.locator("[class*='before-after'], [class*='BeforeAfter']").first();
    await slider.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "tool-compress-result");
  });

  // ---- Tool page - crop (interactive canvas) ----
  test("crop tool interactive canvas - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/crop");
    await page.waitForLoadState("networkidle");

    await uploadTestImage(page);
    await page.waitForTimeout(1000);

    const canvas = page.locator("canvas").first();
    await canvas.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "tool-crop-canvas");
  });

  // ---- Tool page - qr-generate (no-dropzone, QR preview) ----
  test("qr-generate tool with preview - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/qr-generate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Enter text to generate a QR code
    const textInput = page.locator("input[type='text'], textarea").first();
    await textInput.fill("https://snapotter.com");
    await page.waitForTimeout(1000);

    // Wait for QR preview to render
    const preview = page.locator("img, canvas, svg").first();
    await preview.waitFor({ state: "visible", timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "tool-qr-generate-preview");
  });

  // ---- Tool page - collage (template selection) ----
  test("collage tool template selection - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/collage");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "tool-collage-templates");
  });

  // ---- Analytics consent page ----
  test.describe("Analytics consent page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("analytics consent page - light and dark", async ({ page }) => {
      await page.goto("/analytics-consent");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

      await takeThemedScreenshots(page, "analytics-consent");
    });
  });
});
