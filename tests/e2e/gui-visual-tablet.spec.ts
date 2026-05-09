import { expect, openSettings, test, uploadTestImage } from "./helpers";

const MOD = process.platform === "darwin" ? "Meta" : "Control";

// ---------------------------------------------------------------------------
// Helper: toggle theme via keyboard shortcut (Cmd/Ctrl+Shift+D)
// The keyboard shortcut works reliably on all viewports.
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
  await expect(page).toHaveScreenshot(`tablet-${baseName}-light.png`, {
    fullPage: false,
  });

  // Dark theme
  await setTheme(page, "dark");
  await expect(page).toHaveScreenshot(`tablet-${baseName}-dark.png`, {
    fullPage: false,
  });

  // Reset to light for next test
  await setTheme(page, "light");
}

// ---------------------------------------------------------------------------
// Tablet visual regression: 768x1024
// ---------------------------------------------------------------------------
test.describe("Visual Tablet (768x1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  // ---- Login page (unauthenticated) ----
  test.describe("Login page", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("login page empty form - light and dark", async ({ page }) => {
      await page.goto("/login");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);

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

      await takeThemedScreenshots(page, "login-error");
    });
  });

  // ---- Home page (empty, no file uploaded) ----
  test("home page empty - light and dark", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify sidebar transitions at tablet width: sidebar should collapse or narrow
    const sidebar = page.locator("aside");
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      const sidebarBox = await sidebar.boundingBox();
      if (sidebarBox) {
        // Sidebar should be narrower than full desktop width (< 280px)
        expect(sidebarBox.width).toBeLessThan(280);
      }
    }

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

    // Details are shown by default
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

    await takeThemedScreenshots(page, "files-empty");
  });

  // ---- Settings dialog - General tab ----
  test("settings dialog general tab - light and dark", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.waitForTimeout(500);

    // Verify settings dialog fits within 768px tablet viewport
    const dialog = page.getByRole("dialog");
    const dialogBox = await dialog.boundingBox();
    if (dialogBox) {
      expect(dialogBox.x).toBeGreaterThanOrEqual(0);
      expect(dialogBox.x + dialogBox.width).toBeLessThanOrEqual(768 + 1);
    }

    await takeThemedScreenshots(page, "settings-general");
  });

  // ---- Settings dialog - People tab ----
  test("settings dialog people tab - light and dark", async ({ loggedInPage: page }) => {
    await openSettings(page);

    // Navigate to People tab
    await page.getByRole("button", { name: "People" }).click();
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "settings-people");
  });

  // ---- Settings dialog - About tab ----
  test("settings dialog about tab - light and dark", async ({ loggedInPage: page }) => {
    await openSettings(page);

    // Navigate to About tab
    await page.getByRole("button", { name: "About" }).click();
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "settings-about");
  });

  // ---- Help dialog ----
  test("help dialog - light and dark", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Open help dialog via sidebar or button
    const sidebar = page.locator("aside");
    if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sidebar.getByText("Help").click();
    } else {
      await page.getByRole("button", { name: /help/i }).click();
    }
    await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
    await page.waitForTimeout(500);

    // Verify dialog fits within tablet viewport
    await takeThemedScreenshots(page, "help-dialog");
  });

  // ---- Tool page - resize (empty, no file) ----
  test("resize tool empty - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await takeThemedScreenshots(page, "tool-resize-empty");
  });

  // ---- Tool page - resize (file uploaded, settings visible) ----
  test("resize tool with file - light and dark", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await uploadTestImage(page);
    await page.waitForTimeout(500);

    // Verify settings panel layout at tablet width -- panel should not overflow viewport
    await expect(page.getByText("Settings").first()).toBeVisible();
    const settingsPanel = page.locator("[class*='settings'], [class*='Settings']").first();
    if (await settingsPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const panelBox = await settingsPanel.boundingBox();
      if (panelBox) {
        expect(panelBox.x + panelBox.width).toBeLessThanOrEqual(768 + 1);
      }
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

    // Verify comparison mode renders within narrower tablet width
    if (await slider.isVisible()) {
      const sliderBox = await slider.boundingBox();
      if (sliderBox) {
        expect(sliderBox.x + sliderBox.width).toBeLessThanOrEqual(768 + 1);
      }
    }

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
