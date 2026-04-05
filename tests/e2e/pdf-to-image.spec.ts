import path from "node:path";
import { expect, test, waitForProcessing } from "./helpers";

const PDF_FIXTURE = path.join(process.cwd(), "tests", "fixtures", "test-3page.pdf");

test.describe("PDF to Image tool", () => {
  test("converts a PDF page to an image", async ({ loggedInPage: page }) => {
    await page.goto("/pdf-to-image");

    // Upload PDF via file input
    const fileInput = page.locator("input[type='file'][accept='application/pdf']");
    await fileInput.setInputFiles(PDF_FIXTURE);

    // Wait for page count to appear
    await expect(page.getByText("3 pages")).toBeVisible({ timeout: 10_000 });

    // Set pages to just page 1 for a single-image response
    await page.fill("#pdf-pages", "1");

    // Click convert
    await page.getByTestId("pdf-to-image-submit").click();

    // Wait for processing
    await waitForProcessing(page);

    // Verify download link appears
    await expect(page.getByTestId("pdf-to-image-download")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("pdf-to-image-download")).toContainText("Download Image");
  });
});
