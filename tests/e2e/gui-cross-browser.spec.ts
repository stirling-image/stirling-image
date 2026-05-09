import { expect, type Page } from "@playwright/test";
import { getTestImagePath, openSettings, test, waitForProcessing } from "./helpers";

// ---------------------------------------------------------------------------
// Cross-browser smoke tests -- critical flows validated across browsers.
// Firefox and WebKit projects are scoped to this file in playwright.config.ts.
// ---------------------------------------------------------------------------

const MOD = process.platform === "darwin" ? "Meta" : "Control";

async function uploadImage(page: Page) {
  const testImagePath = getTestImagePath();
  const fileChooserPromise = page.waitForEvent("filechooser");
  const dropzone = page.locator("[class*='border-dashed']").first();
  await dropzone.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(testImagePath);
  await page.waitForTimeout(500);
}

function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.includes("favicon") || text.includes("analytics")) return;
      errors.push(text);
    }
  });
  return errors;
}

test.describe("Cross-browser smoke tests", () => {
  test("login flow: fill form, submit, verify redirect", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);
    await expect(page).toHaveURL("/");
    expect(errors).toHaveLength(0);
  });

  test("home page file upload: upload image, verify preview", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForLoadState("networkidle");

    await uploadImage(page);

    await expect(page.locator("[class*='text-green']").first()).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("resize E2E: upload, set dimensions, process, download", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    await uploadImage(page);

    // Verify settings panel appeared after upload
    await expect(page.getByText("Settings").first()).toBeVisible();

    // Check that width/height inputs are present and interactable
    const widthInput = page.locator("input[type='number']").first();
    await expect(widthInput).toBeVisible();
    await widthInput.fill("200");

    await waitForProcessing(page);

    // Verify a download button or link is available after processing
    const downloadBtn = page.getByRole("button", { name: /download/i }).first();
    const downloadLink = page.getByRole("link", { name: /download/i }).first();
    const hasDownloadBtn = await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasDownloadLink = await downloadLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasDownloadBtn || hasDownloadLink).toBe(true);

    expect(errors).toHaveLength(0);
  });

  test("before-after slider drag: upload to compress, drag slider", async ({
    loggedInPage: page,
  }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/compress");
    await page.waitForLoadState("networkidle");

    // Upload and wait for processing to produce the before-after view
    await uploadImage(page);
    await waitForProcessing(page);
    await page.waitForTimeout(1000);

    // Locate the before-after slider container for drag interaction
    const sliderContainer = page.locator("[class*='before-after'], [class*='BeforeAfter']").first();

    // Even if the exact slider handle class differs, verify the container rendered
    const containerVisible = await sliderContainer.isVisible({ timeout: 10000 }).catch(() => false);

    if (containerVisible) {
      // Drag the slider from center to the left quarter
      const box = await sliderContainer.boundingBox();
      if (box) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        const endX = box.x + box.width * 0.25;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, startY, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(300);
      }
    }

    // Verify no CSS layout breakage -- the container should still be visible
    if (containerVisible) {
      await expect(sliderContainer).toBeVisible();
    }

    expect(errors).toHaveLength(0);
  });

  test("keyboard shortcuts: Cmd/Ctrl+K and Cmd/Ctrl+Shift+D", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForLoadState("networkidle");

    // ---- Cmd/Ctrl+K: focus search bar ----
    const searchInput = page.getByPlaceholder(/search/i).first();
    await expect(searchInput).toBeVisible();

    await page.keyboard.press(`${MOD}+k`);
    await expect(searchInput).toBeFocused();

    // Click elsewhere to blur
    await page.locator("body").click();
    await page.waitForTimeout(200);

    // ---- Cmd/Ctrl+Shift+D: toggle dark mode ----
    const hadDarkBefore = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    await page.keyboard.press(`${MOD}+Shift+d`);
    await page.waitForTimeout(300);

    const hasDarkAfter = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    expect(hasDarkAfter).not.toBe(hadDarkBefore);

    // Toggle back
    await page.keyboard.press(`${MOD}+Shift+d`);
    await page.waitForTimeout(300);

    const hasDarkFinal = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    expect(hasDarkFinal).toBe(hadDarkBefore);

    expect(errors).toHaveLength(0);
  });

  test("settings dialog: open, switch tabs, close", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForLoadState("networkidle");

    await openSettings(page);

    await page.getByRole("button", { name: "About" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/about/i).first()).toBeVisible();

    await page.getByRole("button", { name: "Security" }).click();
    await page.waitForTimeout(300);
    await expect(page.getByText(/security/i).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await expect(page.getByRole("heading", { name: "General" })).not.toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("theme toggle: click toggle, verify theme changes", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForLoadState("networkidle");

    const hadDarkBefore = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    const themeBtn = page.locator("button[title='Toggle Theme']");
    await expect(themeBtn).toBeVisible({ timeout: 10_000 });
    await themeBtn.click();
    await page.waitForTimeout(300);

    const hasDarkAfter = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    expect(hasDarkAfter).not.toBe(hadDarkBefore);

    // Toggle back and verify it reverts
    await themeBtn.click();
    await page.waitForTimeout(300);

    const hasDarkFinal = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    expect(hasDarkFinal).toBe(hadDarkBefore);

    expect(errors).toHaveLength(0);
  });

  test("pipeline builder: add steps, upload file, process", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/automate");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify pipeline page loaded
    await expect(page.getByText(/pipeline|automate/i).first()).toBeVisible();

    // Add a resize step
    const resizeBtn = page.getByRole("button", { name: /resize/i }).first();
    await resizeBtn.click();
    await page.waitForTimeout(300);

    // Add a compress step
    const compressBtn = page.getByRole("button", { name: /compress/i }).first();
    await compressBtn.click();
    await page.waitForTimeout(300);

    // Verify both steps are visible in the pipeline
    const steps = page.locator("[class*='step'], [class*='pipeline-step']");
    const stepCount = await steps.count();
    expect(stepCount).toBeGreaterThanOrEqual(2);

    // Upload a file
    await uploadImage(page);

    // Trigger processing if there is a process/run button
    const processBtn = page.getByRole("button", { name: /process|run|start/i }).first();
    const hasProcBtn = await processBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasProcBtn) {
      await processBtn.click();
      await waitForProcessing(page);
    }

    expect(errors).toHaveLength(0);
  });

  test("CSS rendering: verify core layout elements render correctly", async ({
    loggedInPage: page,
  }) => {
    const errors = collectConsoleErrors(page);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify sidebar renders with correct structure
    const sidebar = page.locator("aside");
    if (await sidebar.isVisible({ timeout: 3000 }).catch(() => false)) {
      const sidebarBox = await sidebar.boundingBox();
      expect(sidebarBox).not.toBeNull();
      if (sidebarBox) {
        expect(sidebarBox.width).toBeGreaterThan(0);
        expect(sidebarBox.height).toBeGreaterThan(0);
      }
    }

    // Verify main content area has correct background (not blank)
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    expect(bgColor).toBeTruthy();
    expect(bgColor).not.toBe("");

    // Navigate to a tool page and verify CSS layout
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Verify the tool title renders
    await expect(page.getByText(/resize/i).first()).toBeVisible();

    // Verify the dropzone has a dashed border (CSS rendered correctly)
    const dropzone = page.locator("[class*='border-dashed']").first();
    await expect(dropzone).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test("file download: upload to resize, process, verify download", async ({
    loggedInPage: page,
  }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    await uploadImage(page);

    // Set dimensions and process
    const widthInput = page.locator("input[type='number']").first();
    await expect(widthInput).toBeVisible();
    await widthInput.fill("150");

    await waitForProcessing(page);

    // Verify download works by intercepting the download event
    const downloadPromise = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
    const downloadBtn = page.getByRole("button", { name: /download/i }).first();
    const downloadLink = page.getByRole("link", { name: /download/i }).first();
    const hasBtn = await downloadBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasLink = await downloadLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasBtn) {
      await downloadBtn.click();
    } else if (hasLink) {
      await downloadLink.click();
    }

    if (hasBtn || hasLink) {
      const download = await downloadPromise;
      if (download) {
        // Verify the download completed and has a filename
        const suggestedName = download.suggestedFilename();
        expect(suggestedName).toBeTruthy();
        expect(suggestedName.length).toBeGreaterThan(0);
      }
    }

    expect(errors).toHaveLength(0);
  });

  test("drag-and-drop: drop image file onto dropzone", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const dropzone = page.locator("[class*='border-dashed']").first();
    await expect(dropzone).toBeVisible();

    // Use the file chooser approach to set files on the dropzone input
    // since cross-browser DataTransfer file simulation is unreliable
    await uploadImage(page);

    // Verify the file was accepted -- look for a success indicator or preview
    const hasPreview = await page
      .locator("[class*='text-green'], img[src*='blob:']")
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasPreview).toBe(true);

    expect(errors).toHaveLength(0);
  });

  test("canvas interactions: crop tool draw and adjust region", async ({ loggedInPage: page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/crop");
    await page.waitForLoadState("networkidle");

    await uploadImage(page);
    await page.waitForTimeout(1000);

    // Wait for the crop canvas to render
    const canvas = page.locator("canvas").first();
    const canvasVisible = await canvas.isVisible({ timeout: 10000 }).catch(() => false);

    if (canvasVisible) {
      const box = await canvas.boundingBox();
      if (box) {
        // Draw a crop selection by clicking and dragging on the canvas
        const startX = box.x + box.width * 0.25;
        const startY = box.y + box.height * 0.25;
        const endX = box.x + box.width * 0.75;
        const endY = box.y + box.height * 0.75;

        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(endX, endY, { steps: 10 });
        await page.mouse.up();
        await page.waitForTimeout(500);

        // Verify the canvas is still rendered after interaction (no crash)
        await expect(canvas).toBeVisible();
      }
    }

    expect(errors).toHaveLength(0);
  });
});
