import { expect, test } from "@playwright/test";

test.describe("OCR / Text Extraction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ocr");
    await page.waitForLoadState("networkidle");
  });

  test("renders quality selector with three options", async ({ page }) => {
    const buttons = page.locator("button").filter({ hasText: /^(Fast|Balanced|Best)$/ });
    await expect(buttons).toHaveCount(3);

    // Balanced should be selected by default
    const balanced = page.locator("button").filter({ hasText: "Balanced" });
    await expect(balanced).toHaveClass(/border-primary/);
  });

  test("renders enhance checkbox defaulting to checked", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();
  });

  test("enhance defaults to unchecked when Best is selected", async ({ page }) => {
    await page.locator("button").filter({ hasText: "Best" }).click();
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).not.toBeChecked();
  });

  test("language section is collapsed by default showing auto-detect", async ({ page }) => {
    await expect(page.getByText("auto-detect", { exact: false })).toBeVisible();
    await expect(page.locator("select")).not.toBeVisible();
  });

  test("language section expands to show dropdown", async ({ page }) => {
    await page.getByText("Language").click();
    await expect(page.locator("select")).toBeVisible();

    const options = page.locator("select option");
    await expect(options).toHaveCount(8);
  });

  test("extract text button is disabled without a file", async ({ page }) => {
    const button = page.getByTestId("ocr-submit");
    await expect(button).toBeDisabled();
  });

  test("uploads image and extracts text", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-portrait.jpg");

    const submit = page.getByTestId("ocr-submit");
    await expect(submit).toBeEnabled();
    await submit.click();

    const result = page.getByTestId("ocr-result-text");
    await expect(result).toBeVisible({ timeout: 120_000 });

    const text = await result.inputValue();
    expect(text.length).toBeGreaterThan(0);
  });

  test("result textarea is editable", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-portrait.jpg");
    await page.getByTestId("ocr-submit").click();

    const result = page.getByTestId("ocr-result-text");
    await expect(result).toBeVisible({ timeout: 120_000 });

    await result.fill("edited text");
    await expect(result).toHaveValue("edited text");
  });

  test("copy button works", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-portrait.jpg");
    await page.getByTestId("ocr-submit").click();

    const result = page.getByTestId("ocr-result-text");
    await expect(result).toBeVisible({ timeout: 120_000 });

    await page.getByText("Copy").click();
    await expect(page.getByText("Copied")).toBeVisible();
  });

  test("download button is visible after extraction", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-portrait.jpg");
    await page.getByTestId("ocr-submit").click();

    const result = page.getByTestId("ocr-result-text");
    await expect(result).toBeVisible({ timeout: 120_000 });

    await expect(page.getByText("Download")).toBeVisible();
  });

  test("shows 'no text detected' for blank image", async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("tests/fixtures/test-blank.png");
    await page.getByTestId("ocr-submit").click();

    await expect(page.getByText("No text detected")).toBeVisible({ timeout: 120_000 });
  });
});
