import { test, expect, getTestImagePath } from "./helpers";

test.describe("Automate Page", () => {
  // Retry flaky tests caused by dev server timing
  test.describe.configure({ retries: 3 });

  /**
   * Navigate to /automate and wait for the page to fully render.
   * Uses multiple retry strategies for blank-page flakes.
   */
  async function gotoAutomate(page: import("@playwright/test").Page) {
    const heading = page.getByRole("heading", {
      name: /automation pipeline/i,
    });

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt === 0) {
        await page.goto("/automate", { waitUntil: "networkidle" });
      } else {
        // On retry, wait then reload
        await page.waitForTimeout(500);
        await page.goto("/automate", { waitUntil: "networkidle" });
      }

      try {
        await expect(heading).toBeVisible({ timeout: 8_000 });
        return; // Page loaded successfully
      } catch {
        // Continue to next attempt
      }
    }

    // Final attempt — let it throw if it fails
    await page.goto("/automate", { waitUntil: "networkidle" });
    await expect(heading).toBeVisible({ timeout: 10_000 });
  }

  /** Wait for pipeline steps to render after a template click. */
  async function waitForSteps(
    page: import("@playwright/test").Page,
    count: number,
  ) {
    // Step numbers (1, 2, 3...) appear inside the step cards
    await expect(page.getByTitle("Remove")).toHaveCount(count, {
      timeout: 5_000,
    });
  }

  const testImagePath = getTestImagePath();

  /** Upload the test image via file chooser. */
  async function uploadTestFile(page: import("@playwright/test").Page) {
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: /upload image to process/i })
      .click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    await page.waitForTimeout(500);
  }

  // ─── Page Rendering ───────────────────────────────────────────────────

  test("automate page renders pipeline builder", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await expect(
      page.getByText(/chain multiple tools/i).first(),
    ).toBeVisible();
  });

  test("shows all five pipeline templates", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await expect(page.getByText("Social Media Ready")).toBeVisible();
    await expect(page.getByText("Privacy Clean")).toBeVisible();
    await expect(page.getByText("Web Optimization")).toBeVisible();
    await expect(page.getByText("Profile Picture")).toBeVisible();
    await expect(page.getByText("Watermark Batch")).toBeVisible();
  });

  test("shows template descriptions", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await expect(
      page.getByText(/resize 1080x1080/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/strip all metadata/i).first(),
    ).toBeVisible();
  });

  test("shows empty state message when no steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await expect(
      page.getByText(/add steps to build your automation pipeline/i),
    ).toBeVisible();
  });

  test("shows upload image button", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await expect(
      page.getByRole("button", { name: /upload image to process/i }),
    ).toBeVisible();
  });

  test("has Add Step button", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await expect(
      page.getByRole("button", { name: /add step/i }),
    ).toBeVisible();
  });

  test("has Process button (disabled when no steps or file)", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    const processBtn = page.getByRole("button", {
      name: "Process",
      exact: true,
    });
    await expect(processBtn).toBeVisible();
    await expect(processBtn).toBeDisabled();
  });

  test("has Save Pipeline button (disabled when no steps)", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    const saveBtn = page.getByRole("button", { name: "Save Pipeline" });
    await expect(saveBtn).toBeVisible();
    await expect(saveBtn).toBeDisabled();
  });

  // ─── Template Loading ─────────────────────────────────────────────────

  test("clicking Social Media Ready template loads 4 steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Social Media Ready").click();
    await waitForSteps(page, 4);
    // Verify empty state is gone
    await expect(
      page.getByText(/add steps to build your automation pipeline/i),
    ).not.toBeVisible();
  });

  test("clicking Privacy Clean template loads 2 steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);
  });

  test("clicking Web Optimization template loads 3 steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Web Optimization").click();
    await waitForSteps(page, 3);
  });

  test("clicking Profile Picture template loads 2 steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Profile Picture").click();
    await waitForSteps(page, 2);
  });

  test("clicking Watermark Batch template loads 3 steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Watermark Batch").click();
    await waitForSteps(page, 3);
  });

  test("loading a template replaces previous steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Social Media Ready").click();
    await waitForSteps(page, 4);

    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);
  });

  // ─── Add Step ─────────────────────────────────────────────────────────

  test("clicking Add Step opens tool picker", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByRole("button", { name: /add step/i }).click();
    await expect(page.getByText("Add a step")).toBeVisible();
  });

  test("tool picker shows available tools", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByRole("button", { name: /add step/i }).click();
    const pickerArea = page.locator(".max-h-64.overflow-y-auto");
    await expect(pickerArea.getByText("Resize").first()).toBeVisible();
    await expect(pickerArea.getByText("Convert").first()).toBeVisible();
  });

  test("selecting a tool from picker adds a step", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByRole("button", { name: /add step/i }).click();
    const pickerArea = page.locator(".max-h-64.overflow-y-auto");
    await pickerArea
      .getByText("Resize", { exact: false })
      .first()
      .click();
    await waitForSteps(page, 1);
  });

  test("can add multiple steps", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);

    await page.getByRole("button", { name: /add step/i }).click();
    let picker = page.locator(".max-h-64.overflow-y-auto");
    await picker.getByText("Resize", { exact: false }).first().click();
    await waitForSteps(page, 1);

    await page.getByRole("button", { name: /add step/i }).click();
    picker = page.locator(".max-h-64.overflow-y-auto");
    await picker.getByText("Convert", { exact: false }).first().click();
    await waitForSteps(page, 2);
  });

  // ─── Step Controls ────────────────────────────────────────────────────

  test("can remove a step", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByTitle("Remove").first().click();
    await waitForSteps(page, 1);
  });

  test("can expand step settings", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByTitle("Settings").first().click();
    await expect(
      page.getByText(/default settings will be used/i),
    ).toBeVisible();
  });

  test("move up button disabled on first step", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Social Media Ready").click();
    await waitForSteps(page, 4);

    await expect(page.getByTitle("Move up").first()).toBeDisabled();
  });

  test("move down button disabled on last step", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Social Media Ready").click();
    await waitForSteps(page, 4);

    await expect(page.getByTitle("Move down").last()).toBeDisabled();
  });

  // ─── File Upload ──────────────────────────────────────────────────────

  test("can upload a file via file chooser", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await uploadTestFile(page);

    // File name and size should be visible in the upload area
    await expect(page.getByText("test-image.png")).toBeVisible();
    // The file size text is inside the dashed border area
    const uploadArea = page.locator("[class*='border-dashed']").first();
    await expect(uploadArea.getByText(/KB\)/)).toBeVisible();
  });

  test("can remove uploaded file", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);
    await uploadTestFile(page);
    await expect(page.getByText("test-image.png")).toBeVisible();

    // Remove file — the X button inside the dashed upload area
    const uploadArea = page.locator("[class*='border-dashed']").first();
    await uploadArea.locator("button").click();

    await expect(
      page.getByRole("button", { name: /upload image to process/i }),
    ).toBeVisible();
  });

  // ─── Save Pipeline ────────────────────────────────────────────────────

  test("Save Pipeline button enables after adding steps", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await expect(
      page.getByRole("button", { name: "Save Pipeline" }),
    ).toBeEnabled();
  });

  test("clicking Save Pipeline shows name input form", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await expect(
      page.getByPlaceholder("Pipeline name"),
    ).toBeVisible();
  });

  test("Save button disabled when name is empty", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByRole("button", { name: "Save Pipeline" }).click();
    const saveSubmitBtn = page.getByRole("button", {
      name: "Save",
      exact: true,
    });
    await expect(saveSubmitBtn).toBeDisabled();
  });

  test("can save a pipeline with name and see it in sidebar", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    const uniqueName = `E2E Pipeline ${Date.now()}`;
    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await page.getByPlaceholder("Pipeline name").fill(uniqueName);
    await page
      .getByRole("button", { name: "Save", exact: true })
      .click();

    // Wait for the pipeline to appear in sidebar
    await expect(page.getByText(uniqueName).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("can close save form without saving", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await expect(
      page.getByPlaceholder("Pipeline name"),
    ).toBeVisible();

    // Close the form — the last button in the save form row
    const formRow = page.locator(".flex.items-center.gap-2.flex-1");
    await formRow.locator("button").last().click();

    await expect(
      page.getByRole("button", { name: "Save Pipeline" }),
    ).toBeVisible();
  });

  // ─── Pipeline Execution ───────────────────────────────────────────────

  test("Process button enables when steps and file are set", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);
    await uploadTestFile(page);

    await expect(
      page.getByRole("button", { name: "Process", exact: true }),
    ).toBeEnabled();
  });

  test("executing pipeline shows success result", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);
    await uploadTestFile(page);

    await page
      .getByRole("button", { name: "Process", exact: true })
      .click();

    // Wait for result (pipeline completed text)
    await expect(
      page.getByText(/pipeline completed/i),
    ).toBeVisible({ timeout: 30_000 });

    // Should show original/processed sizes
    await expect(page.getByText(/original/i)).toBeVisible();
    await expect(page.getByText(/processed/i)).toBeVisible();

    // Should show download button
    await expect(
      page.getByRole("link", { name: /download result/i }),
    ).toBeVisible();
  });

  test("executing Social Media Ready template works", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Social Media Ready").click();
    await waitForSteps(page, 4);
    await uploadTestFile(page);

    await page
      .getByRole("button", { name: "Process", exact: true })
      .click();

    await expect(
      page.getByText(/pipeline completed/i),
    ).toBeVisible({ timeout: 30_000 });
  });

  // ─── Saved Pipeline Interactions ──────────────────────────────────────

  test("can load a saved pipeline into builder", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);

    const uniqueName = `Load Pipeline ${Date.now()}`;

    // Save a pipeline
    await page.getByText("Web Optimization").click();
    await waitForSteps(page, 3);

    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await page.getByPlaceholder("Pipeline name").fill(uniqueName);
    await page
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(page.getByText(uniqueName).first()).toBeVisible({
      timeout: 5_000,
    });

    // Switch to different template
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    // Click on the saved pipeline to load it
    await page
      .getByRole("button", { name: uniqueName })
      .first()
      .click();
    await waitForSteps(page, 3);
  });

  test("can delete a saved pipeline", async ({ loggedInPage: page }) => {
    await gotoAutomate(page);

    const uniqueName = `Delete Pipeline ${Date.now()}`;

    // Save a pipeline
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await page.getByPlaceholder("Pipeline name").fill(uniqueName);
    await page
      .getByRole("button", { name: "Save", exact: true })
      .click();
    await expect(page.getByText(uniqueName).first()).toBeVisible({
      timeout: 5_000,
    });

    // Hover to reveal delete, then click
    const pipelineEntry = page
      .locator(".group")
      .filter({ hasText: uniqueName })
      .first();
    await pipelineEntry.hover();
    await pipelineEntry
      .locator("button")
      .filter({ has: page.locator("svg") })
      .last()
      .click();

    await expect(pipelineEntry).not.toBeVisible({ timeout: 5_000 });
  });

  // ─── Sidebar ──────────────────────────────────────────────────────────

  test("sidebar Templates section is visible", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await expect(
      page.getByRole("heading", { name: "Templates" }),
    ).toBeVisible();
  });

  test("sidebar shows Saved Automations when pipelines exist", async ({
    loggedInPage: page,
  }) => {
    await gotoAutomate(page);
    await page.getByText("Privacy Clean").click();
    await waitForSteps(page, 2);

    const uniqueName = `Sidebar Pipeline ${Date.now()}`;
    await page.getByRole("button", { name: "Save Pipeline" }).click();
    await page.getByPlaceholder("Pipeline name").fill(uniqueName);
    await page
      .getByRole("button", { name: "Save", exact: true })
      .click();

    await expect(page.getByText("Saved Automations")).toBeVisible({
      timeout: 5_000,
    });
  });
});
