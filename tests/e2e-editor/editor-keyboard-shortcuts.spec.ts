import { createNewDocument, expect, selectTool, test } from "./helpers";

test.describe("Editor Keyboard Shortcuts", () => {
  test.beforeEach(async ({ editorPage: page }) => {
    await createNewDocument(page);
  });

  test("V activates move tool", async ({ editorPage: page }) => {
    await selectTool(page, "brush"); // start elsewhere
    await page.keyboard.press("v");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='move']")).toHaveAttribute("data-tool-active", "true");
  });

  test("B activates brush tool", async ({ editorPage: page }) => {
    await page.keyboard.press("b");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='brush']")).toHaveAttribute("data-tool-active", "true");
  });

  test("E activates eraser tool", async ({ editorPage: page }) => {
    await page.keyboard.press("e");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='eraser']")).toHaveAttribute("data-tool-active", "true");
  });

  test("C activates crop tool", async ({ editorPage: page }) => {
    await page.keyboard.press("c");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='crop']")).toHaveAttribute("data-tool-active", "true");
  });

  test("M activates marquee tool", async ({ editorPage: page }) => {
    await page.keyboard.press("m");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='marquee-rect']")).toHaveAttribute(
      "data-tool-active",
      "true",
    );
  });

  test("I activates eyedropper tool", async ({ editorPage: page }) => {
    await page.keyboard.press("i");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='eyedropper']")).toHaveAttribute(
      "data-tool-active",
      "true",
    );
  });

  test("G activates fill tool", async ({ editorPage: page }) => {
    await page.keyboard.press("g");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='fill']")).toHaveAttribute("data-tool-active", "true");
  });

  test("H activates hand tool", async ({ editorPage: page }) => {
    await page.keyboard.press("h");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='hand']")).toHaveAttribute("data-tool-active", "true");
  });

  test("Z activates zoom tool", async ({ editorPage: page }) => {
    await page.keyboard.press("z");
    await page.waitForTimeout(300);

    await expect(page.locator("[data-tool='zoom']")).toHaveAttribute("data-tool-active", "true");
  });

  test("shortcuts are disabled when typing in text input", async ({ editorPage: page }) => {
    // Focus the zoom input in the status bar (a number input)
    const zoomInput = page.locator("[data-testid='status-zoom'] input[type='number']");
    await zoomInput.click();
    await zoomInput.fill("");

    // Pressing B while focused in input should NOT switch tool
    const activeBefore = await page.locator("[data-tool-active='true']").getAttribute("data-tool");

    await page.keyboard.press("b");
    await page.waitForTimeout(300);

    const activeAfter = await page.locator("[data-tool-active='true']").getAttribute("data-tool");

    // Tool should not have changed to brush
    expect(activeAfter).toBe(activeBefore);
  });
});
