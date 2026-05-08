import { expect, test, uploadTestImage, waitForProcessing } from "./helpers";

// ---------------------------------------------------------------------------
// GUI E2E: Beautify Screenshot Tool
// ---------------------------------------------------------------------------

test.describe("Beautify Screenshot", () => {
  test("renders tool page with settings", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");
    await expect(page.getByText("Beautify Screenshot").first()).toBeVisible();
  });

  test("uploads image and shows preview", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");
    await uploadTestImage(page);
    await page.waitForTimeout(1000);

    // Verify the image appeared in the preview area
    await expect(page.locator("img").first()).toBeVisible();
  });

  test("shows preset cards", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");

    // Quick Presets section is open by default
    await expect(page.getByText("Quick Presets").first()).toBeVisible();
    await expect(page.getByText("Purple Haze").first()).toBeVisible();
    await expect(page.getByText("Flamingo").first()).toBeVisible();
    await expect(page.getByText("Ocean").first()).toBeVisible();
  });

  test("shows background, frame, spacing, and shadow sections", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");

    await expect(page.getByText("Background").first()).toBeVisible();
    await expect(page.getByText("Device Frame").first()).toBeVisible();
    await expect(page.getByText("Spacing").first()).toBeVisible();
    await expect(page.getByText("Shadow").first()).toBeVisible();
  });

  test("submit button uses data-testid", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");
    await uploadTestImage(page);

    await expect(page.getByTestId("beautify-submit")).toBeVisible();
  });

  test("processes image with default settings", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");
    await uploadTestImage(page);
    await page.waitForTimeout(1500);

    // Click the Beautify button
    const processBtn = page.getByTestId("beautify-submit");
    await expect(processBtn).toBeEnabled({ timeout: 5000 });
    await processBtn.click();

    // Wait for download link to appear (processing may be fast enough to skip spinner)
    await expect(
      page
        .getByTestId("beautify-download")
        .or(page.getByRole("link", { name: /download/i }).first()),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("applies preset and processes", async ({ loggedInPage: page }) => {
    await page.goto("/beautify");
    await uploadTestImage(page);
    await page.waitForTimeout(1500);

    // Click a preset card
    const presetCards = page.locator("button").filter({ hasText: /purple haze|flamingo|ocean/i });
    if (
      await presetCards
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false)
    ) {
      await presetCards.first().click();
      await page.waitForTimeout(500);
    }

    // Process
    const processBtn = page.getByTestId("beautify-submit");
    await expect(processBtn).toBeEnabled({ timeout: 5000 });
    await processBtn.click();

    await expect(
      page
        .getByTestId("beautify-download")
        .or(page.getByRole("link", { name: /download/i }).first()),
    ).toBeVisible({ timeout: 30_000 });
  });
});
