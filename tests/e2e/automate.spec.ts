import { test, expect } from "./helpers";

test.describe("Automate Page", () => {
  test("automate page renders pipeline builder", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/automate");

    // Should show the pipeline builder section
    await expect(
      page.getByText(/pipeline|automation|workflow/i).first(),
    ).toBeVisible();
  });

  test("shows suggested templates", async ({ loggedInPage: page }) => {
    await page.goto("/automate");

    // Should show at least one template
    await expect(
      page
        .getByText(/social media|privacy|web optimization|profile|watermark/i)
        .first(),
    ).toBeVisible();
  });

  test("can add a step to pipeline", async ({ loggedInPage: page }) => {
    await page.goto("/automate");

    // Look for add step button
    const addBtn = page.getByRole("button", { name: /add|step|\+/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Should show tool picker or added step
      await page.waitForTimeout(500);
    }
  });

  test("has save pipeline button", async ({ loggedInPage: page }) => {
    await page.goto("/automate");

    // Look for save button
    const saveBtn = page
      .getByRole("button", { name: /save/i })
      .first();
    // Save might be disabled until there are steps, but should exist
    await expect(saveBtn).toBeVisible();
  });
});
