import { createNewDocument, expect, test } from "./helpers";

test.describe("Editor Export", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
  });

  test("export dialog opens via Ctrl+Shift+S", async ({ editorPage: page }) => {
    await page.keyboard.press("Control+Shift+s");
    await page.waitForTimeout(500);

    // Export dialog should appear with "Export Image" heading
    await expect(page.getByText("Export Image")).toBeVisible();
  });

  test("export dialog has format options PNG, JPEG, WebP", async ({ editorPage: page }) => {
    await page.keyboard.press("Control+Shift+s");
    await page.waitForTimeout(500);

    await expect(page.getByText("PNG", { exact: true })).toBeVisible();
    await expect(page.getByText("JPEG", { exact: true })).toBeVisible();
    await expect(page.getByText("WebP", { exact: true })).toBeVisible();
  });

  test("export dialog has dimension inputs and aspect lock", async ({ editorPage: page }) => {
    await page.keyboard.press("Control+Shift+s");
    await page.waitForTimeout(500);

    await expect(page.getByText("Dimensions")).toBeVisible();
    await expect(page.getByText("Width")).toBeVisible();
    await expect(page.getByText("Height")).toBeVisible();

    // Aspect lock button
    const lockBtn = page.locator(
      "button[aria-label='Unlock aspect ratio'], button[aria-label='Lock aspect ratio']",
    );
    await expect(lockBtn).toBeVisible();
  });

  test("export dialog has export, copy, save, and load buttons", async ({ editorPage: page }) => {
    await page.keyboard.press("Control+Shift+s");
    await page.waitForTimeout(500);

    await expect(page.getByText("Export", { exact: true })).toBeVisible();
    await expect(page.getByText("Copy", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Save Project")).toBeVisible();
    await expect(page.getByText("Load Project")).toBeVisible();
  });
});
