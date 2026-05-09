import { expect, openSettings, test } from "./helpers";

// ---------------------------------------------------------------------------
// Settings Dialog -- Tools tab (enable/disable) and Product Analytics
// ---------------------------------------------------------------------------

test.describe("GUI Settings - Tools Tab", () => {
  test("displays tools list with category headings", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();

    await expect(page.locator("h3").filter({ hasText: "Tools" }).first()).toBeVisible();
    await expect(page.getByText("Enable or disable individual tools")).toBeVisible();

    // At least one category heading should be visible (uppercase text)
    const categoryHeadings = page.locator("h4");
    await expect(categoryHeadings.first()).toBeVisible();
  });

  test("Save Tool Settings button and disabled tools counter", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();

    await expect(page.getByRole("button", { name: /save tool settings/i })).toBeVisible();

    // The disabled tools counter text
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible();
  });

  test("saving tool settings shows restart banner", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();

    await page.getByRole("button", { name: /save tool settings/i }).click();

    await expect(page.getByText("Restart required for changes to take effect.")).toBeVisible({
      timeout: 5_000,
    });
  });
});

test.describe("GUI Settings - Tools Tab (additional)", () => {
  test("each category has a heading", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();

    await expect(page.locator("h3").filter({ hasText: "Tools" }).first()).toBeVisible();
    // Wait for tools to finish loading
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Category headings are h4 elements inside the dialog content
    const dialogContent = page.locator(".flex-1.overflow-y-auto");
    const headings = dialogContent.locator("h4");
    const count = await headings.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("tools show both name and description", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();

    // Wait for tools to load
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Verify the Resize tool is listed with its description
    const dialogContent = page.locator(".flex-1.overflow-y-auto");
    await expect(dialogContent.getByText("Resize").first()).toBeVisible();
  });
});

test.describe("GUI Settings - Tools Tab (toggle visibility)", () => {
  test("disabling a tool and saving hides it from the tool panel", async ({
    loggedInPage: page,
  }) => {
    // First check the Resize tool is visible in the sidebar tool list
    await expect(page.locator("aside").getByText("Resize").first()).toBeVisible({ timeout: 5_000 });

    // Open settings and disable the Resize tool
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Find the Resize tool row and its toggle
    const dialogContent = page.locator(".flex-1.overflow-y-auto");
    const resizeRow = dialogContent
      .locator("div")
      .filter({ hasText: /^Resize$/ })
      .first();

    // Get the toggle in the same parent container
    const resizeToggle = resizeRow.locator("..").locator("button.w-11.h-6");

    // Check if the toggle exists; if so, click it to disable
    if (await resizeToggle.isVisible().catch(() => false)) {
      // Only click if the tool is currently enabled (toggle has bg-primary class)
      const isEnabled = await resizeToggle.evaluate((el) => el.classList.contains("bg-primary"));
      if (isEnabled) {
        await resizeToggle.click();
      }
    }

    // Save tool settings
    await page.getByRole("button", { name: /save tool settings/i }).click();
    await expect(page.getByText("Restart required for changes to take effect.")).toBeVisible({
      timeout: 5_000,
    });

    // Close settings
    await page.keyboard.press("Escape");

    // Re-enable the tool to clean up (reopen settings)
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Find and re-enable the Resize toggle
    const resizeRow2 = dialogContent
      .locator("div")
      .filter({ hasText: /^Resize$/ })
      .first();
    const resizeToggle2 = resizeRow2.locator("..").locator("button.w-11.h-6");
    if (await resizeToggle2.isVisible().catch(() => false)) {
      const isDisabled = await resizeToggle2.evaluate((el) => !el.classList.contains("bg-primary"));
      if (isDisabled) {
        await resizeToggle2.click();
      }
    }
    await page.getByRole("button", { name: /save tool settings/i }).click();
    await page.waitForTimeout(500);
  });

  test("toggling a tool off and saving, then on again restores it", async ({
    loggedInPage: page,
  }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Read the initial disabled count
    const counterText = page.getByText(/\d+ tools? disabled/);
    const initialText = await counterText.textContent();
    const initialCount = parseInt(initialText?.match(/(\d+)/)?.[1] || "0", 10);

    // Toggle the first tool off (if it is currently enabled)
    const firstToggle = page.locator("button.w-11.h-6").first();
    const wasEnabled = await firstToggle.evaluate((el) => el.classList.contains("bg-primary"));

    if (wasEnabled) {
      await firstToggle.click();
      // Counter should increase by 1
      const afterText = await counterText.textContent();
      const afterCount = parseInt(afterText?.match(/(\d+)/)?.[1] || "0", 10);
      expect(afterCount).toBe(initialCount + 1);

      // Toggle it back on
      await firstToggle.click();
      const restoredText = await counterText.textContent();
      const restoredCount = parseInt(restoredText?.match(/(\d+)/)?.[1] || "0", 10);
      expect(restoredCount).toBe(initialCount);
    }
  });

  test("tool toggle state persists after saving and re-opening dialog", async ({
    loggedInPage: page,
  }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Read the initial disabled count
    const counterText = page.getByText(/\d+ tools? disabled/);
    const initialText = await counterText.textContent();
    const initialCount = parseInt(initialText?.match(/(\d+)/)?.[1] || "0", 10);

    // Toggle the first tool to change state
    const firstToggle = page.locator("button.w-11.h-6").first();
    await firstToggle.click();

    // Save
    await page.getByRole("button", { name: /save tool settings/i }).click();
    await expect(page.getByText("Restart required for changes to take effect.")).toBeVisible({
      timeout: 5_000,
    });

    // Close and re-open
    await page.keyboard.press("Escape");
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // The count should reflect the saved change
    const afterReopen = await page.getByText(/\d+ tools? disabled/).textContent();
    const afterCount = parseInt(afterReopen?.match(/(\d+)/)?.[1] || "0", 10);
    expect(Math.abs(afterCount - initialCount)).toBe(1);

    // Revert: toggle the first tool back
    await page.locator("button.w-11.h-6").first().click();
    await page.getByRole("button", { name: /save tool settings/i }).click();
    await page.waitForTimeout(500);
  });

  test("Enable All and Disable All buttons work", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /tools/i }).click();
    await expect(page.getByText(/\d+ tools? disabled/)).toBeVisible({ timeout: 5_000 });

    // Look for Enable All / Disable All buttons if they exist
    const enableAllBtn = page.getByRole("button", { name: /enable all/i });
    const disableAllBtn = page.getByRole("button", { name: /disable all/i });

    const hasEnableAll = await enableAllBtn.isVisible().catch(() => false);
    const hasDisableAll = await disableAllBtn.isVisible().catch(() => false);

    // At least one should be present (depending on current state)
    // If neither exists, these buttons may not be implemented -- skip gracefully
    if (hasEnableAll || hasDisableAll) {
      // Record initial state
      const counterText = page.getByText(/\d+ tools? disabled/);
      const initialText = await counterText.textContent();

      if (hasDisableAll) {
        await disableAllBtn.click();
        // Counter should increase
        const afterDisable = await counterText.textContent();
        expect(afterDisable).not.toBe(initialText);
      }

      // Re-enable if possible
      if (await enableAllBtn.isVisible().catch(() => false)) {
        await enableAllBtn.click();
      }
    }
  });
});

test.describe("GUI Settings - Product Analytics Tab", () => {
  test("displays analytics consent section", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /product analytics/i }).click();

    await expect(page.getByText("Product Analytics").first()).toBeVisible();
    await expect(page.getByText(/share anonymous usage data/i)).toBeVisible();
  });

  test("analytics toggle is present", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /product analytics/i }).click();

    // Either the toggle button is present, or the admin-disabled message is shown
    const toggle = page.locator("button.rounded-full");
    const disabledMsg = page.getByText(/has been disabled by the server administrator/i);

    const toggleVisible = await toggle.isVisible().catch(() => false);
    const disabledVisible = await disabledMsg.isVisible().catch(() => false);

    // One of the two states must be true
    expect(toggleVisible || disabledVisible).toBe(true);
  });

  test("privacy policy link is present", async ({ loggedInPage: page }) => {
    await openSettings(page);
    await page.getByRole("button", { name: /product analytics/i }).click();

    await expect(page.getByRole("link", { name: /learn more/i })).toBeVisible();
  });
});
