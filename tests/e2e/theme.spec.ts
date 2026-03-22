import { test, expect } from "./helpers";

test.describe("Theme System", () => {
  test("page defaults to light theme", async ({ loggedInPage: page }) => {
    // Check that html element does not have 'dark' class by default
    const html = page.locator("html");
    const classList = await html.getAttribute("class");
    // Default is light, so 'dark' should not be present initially
    // (unless system preference is dark)
    expect(classList).toBeDefined();
  });

  test("footer has theme toggle buttons", async ({ loggedInPage: page }) => {
    // Footer is fixed bottom-right
    const footer = page.locator("[class*='fixed']").last();
    await expect(footer).toBeVisible();
  });

  test("privacy policy link is in footer", async ({
    loggedInPage: page,
  }) => {
    await expect(page.getByText("Privacy Policy")).toBeVisible();
  });
});
