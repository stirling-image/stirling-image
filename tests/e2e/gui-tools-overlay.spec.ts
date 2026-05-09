import { expect, test, uploadTestImage, waitForProcessing } from "./helpers";

// ---------------------------------------------------------------------------
// GUI E2E: Watermark & Overlay Tools
// (watermark-text, watermark-image, text-overlay, compose, border)
// ---------------------------------------------------------------------------

test.describe("GUI Watermark & Overlay Tools", () => {
  // ========================================================================
  // WATERMARK TEXT
  // ========================================================================
  test.describe("Watermark Text", () => {
    test("renders tool page with dropzone", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await expect(page.getByText("Text Watermark").first()).toBeVisible();
      await expect(page.getByText("Upload from computer")).toBeVisible();
    });

    test("shows watermark text input and settings after upload", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-text-text")).toBeVisible();
      // Default text is "Sample Watermark"
      await expect(page.locator("#watermark-text-text")).toHaveValue("Sample Watermark");
    });

    test("font size slider visible", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-text-font-size")).toBeVisible();
    });

    test("submit disabled without file, enabled with file", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");

      const submitBtn = page.getByTestId("watermark-text-submit");
      await expect(submitBtn).toBeDisabled();

      await uploadTestImage(page);
      await expect(submitBtn).toBeEnabled();
    });

    test("shows color picker for watermark text", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-text-color")).toBeVisible();
    });

    test("shows opacity slider", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-text-opacity")).toBeVisible();
    });

    test("shows position dropdown with all options", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      const select = page.locator("#watermark-text-position");
      await expect(select).toBeVisible();
      const options = select.locator("option");
      await expect(options).toHaveCount(6); // center, top-left, top-right, bottom-left, bottom-right, tiled
    });

    test("shows rotation slider", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-text-rotation")).toBeVisible();
    });

    test("opacity slider is interactive", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      const slider = page.locator("#watermark-text-opacity");
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute("type", "range");
    });

    test("font size slider is interactive", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      const slider = page.locator("#watermark-text-font-size");
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute("type", "range");
    });

    test("changing text input updates value", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await page.locator("#watermark-text-text").fill("My Custom Text");
      await expect(page.locator("#watermark-text-text")).toHaveValue("My Custom Text");
    });

    test("processes watermark and shows download", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-text");
      await uploadTestImage(page);

      await page.locator("#watermark-text-text").fill("Test Watermark");
      await page.getByTestId("watermark-text-submit").click();
      await waitForProcessing(page);

      await expect(page.getByTestId("watermark-text-download")).toBeVisible({
        timeout: 15_000,
      });
    });
  });

  // ========================================================================
  // WATERMARK IMAGE
  // ========================================================================
  test.describe("Watermark Image", () => {
    test("renders tool page with dropzone", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await expect(page.getByText("Image Watermark").first()).toBeVisible();
      await expect(page.getByText("Upload from computer")).toBeVisible();
    });

    test("shows position and opacity controls after upload", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      // Position selector should be visible
      await expect(page.getByText(/position/i).first()).toBeVisible();
      // Opacity slider
      await expect(page.getByText(/opacity/i).first()).toBeVisible();
    });

    test("shows watermark upload area after main image upload", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      // Should see a prompt to upload the watermark/logo image
      await expect(page.getByText(/watermark|logo|overlay/i).first()).toBeVisible();
    });

    test("shows position dropdown with five options", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      const select = page.locator("#watermark-image-position");
      await expect(select).toBeVisible();
      const options = select.locator("option");
      await expect(options).toHaveCount(5); // center, top-left, top-right, bottom-left, bottom-right
    });

    test("shows opacity slider with percentage", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-image-opacity")).toBeVisible();
    });

    test("shows scale slider with percentage", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      await expect(page.locator("#watermark-image-scale")).toBeVisible();
    });

    test("submit disabled without watermark file", async ({ loggedInPage: page }) => {
      await page.goto("/watermark-image");
      await uploadTestImage(page);

      const submitBtn = page.getByTestId("watermark-image-submit");
      await expect(submitBtn).toBeDisabled();
    });
  });

  // ========================================================================
  // TEXT OVERLAY
  // ========================================================================
  test.describe("Text Overlay", () => {
    test("renders tool page with dropzone", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await expect(page.getByText("Text Overlay").first()).toBeVisible();
      await expect(page.getByText("Upload from computer")).toBeVisible();
    });

    test("shows text input and font size slider after upload", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await expect(page.locator("#text-overlay-text")).toBeVisible();
      await expect(page.locator("#text-overlay-text")).toHaveValue("Your Text Here");
      await expect(page.locator("#text-overlay-font-size")).toBeVisible();
    });

    test("submit disabled without file, enabled with file", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");

      const submitBtn = page.getByTestId("text-overlay-submit");
      await expect(submitBtn).toBeDisabled();

      await uploadTestImage(page);
      await expect(submitBtn).toBeEnabled();
    });

    test("shows text color picker", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await expect(page.locator("#text-overlay-color")).toBeVisible();
    });

    test("shows position dropdown with three options", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      const select = page.locator("#text-overlay-position");
      await expect(select).toBeVisible();
      const options = select.locator("option");
      await expect(options).toHaveCount(3); // top, center, bottom
    });

    test("shows drop shadow checkbox", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await expect(page.getByText("Drop Shadow")).toBeVisible();
    });

    test("background box checkbox reveals box color picker", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await expect(page.getByText("Background Box")).toBeVisible();

      // Box color should NOT be visible by default
      await expect(page.locator("#text-overlay-box-color")).not.toBeVisible();

      // Check Background Box
      await page
        .locator("label")
        .filter({ hasText: "Background Box" })
        .locator("input[type='checkbox']")
        .check();

      // Box color picker should now appear
      await expect(page.locator("#text-overlay-box-color")).toBeVisible();
    });

    test("font size slider is interactive", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      const slider = page.locator("#text-overlay-font-size");
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute("type", "range");
    });

    test("changing text input updates value", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await page.locator("#text-overlay-text").fill("Custom Overlay");
      await expect(page.locator("#text-overlay-text")).toHaveValue("Custom Overlay");
    });

    test("processes text overlay and shows download", async ({ loggedInPage: page }) => {
      await page.goto("/text-overlay");
      await uploadTestImage(page);

      await page.getByTestId("text-overlay-submit").click();
      await waitForProcessing(page);

      await expect(page.getByTestId("text-overlay-download")).toBeVisible({ timeout: 15_000 });
    });
  });

  // ========================================================================
  // COMPOSE (Image Composition)
  // ========================================================================
  test.describe("Compose", () => {
    test("renders tool page with dropzone", async ({ loggedInPage: page }) => {
      await page.goto("/compose");
      await expect(page.getByText("Image Composition").first()).toBeVisible();
      await expect(page.getByText("Upload from computer")).toBeVisible();
    });

    test("shows overlay upload and position controls", async ({ loggedInPage: page }) => {
      await page.goto("/compose");

      // Position and opacity controls visible in settings panel
      await expect(page.getByText("X Position")).toBeVisible();
      await expect(page.getByText("Y Position")).toBeVisible();
      await expect(page.getByText("Opacity").first()).toBeVisible();
      await expect(page.getByText("Blend Mode")).toBeVisible();
      await expect(page.getByTestId("compose-submit")).toBeVisible();
    });

    test("shows overlay image upload button", async ({ loggedInPage: page }) => {
      await page.goto("/compose");

      await expect(page.getByText("Overlay Image").first()).toBeVisible();
      await expect(page.getByText("Choose overlay image")).toBeVisible();
    });

    test("shows X and Y position number inputs", async ({ loggedInPage: page }) => {
      await page.goto("/compose");

      await expect(page.locator("#compose-x-position")).toBeVisible();
      await expect(page.locator("#compose-y-position")).toBeVisible();
    });

    test("shows opacity slider", async ({ loggedInPage: page }) => {
      await page.goto("/compose");

      await expect(page.locator("#compose-opacity")).toBeVisible();
    });

    test("blend mode dropdown has all options", async ({ loggedInPage: page }) => {
      await page.goto("/compose");

      const select = page.locator("#compose-blend-mode");
      await expect(select).toBeVisible();
      const options = select.locator("option");
      await expect(options).toHaveCount(10); // Normal, Multiply, Screen, Overlay, Darken, Lighten, Hard Light, Soft Light, Difference, Exclusion
    });

    test("submit disabled without overlay file", async ({ loggedInPage: page }) => {
      await page.goto("/compose");
      await uploadTestImage(page);

      const submitBtn = page.getByTestId("compose-submit");
      await expect(submitBtn).toBeDisabled();
    });
  });

  // ========================================================================
  // BORDER
  // ========================================================================
  test.describe("Border", () => {
    test("renders tool page with dropzone", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await expect(page.getByText("Border").first()).toBeVisible();
      await expect(page.getByText("Upload from computer")).toBeVisible();
    });

    test("shows border preset buttons after upload", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      // Presets from border-settings.tsx
      await expect(page.getByText("Clean White").first()).toBeVisible();
      await expect(page.getByText("Gallery Black").first()).toBeVisible();
      await expect(page.getByText("Shadow").first()).toBeVisible();
      await expect(page.getByText("Rounded").first()).toBeVisible();
    });

    test("shows border width and color controls after upload", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.getByText(/border width|width/i).first()).toBeVisible();
    });

    test("submit button uses data-testid", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.getByTestId("border-submit")).toBeVisible();
    });

    test("shows border width slider", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.locator("#border-width")).toBeVisible();
    });

    test("shows border color swatches", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.locator("#border-color")).toBeVisible();
    });

    test("shows padding slider", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.locator("#border-padding")).toBeVisible();
    });

    test("shows padding color swatches", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.locator("#padding-color")).toBeVisible();
    });

    test("shows corner radius slider", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.locator("#border-corner-radius")).toBeVisible();
    });

    test("shadow toggle reveals shadow controls", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      // Shadow toggle switch
      const shadowToggle = page.locator("button[role='switch'][aria-checked]").first();
      await expect(shadowToggle).toBeVisible();

      // Shadow blur should not be visible before toggle
      await expect(page.locator("#shadow-blur")).not.toBeVisible();

      // Toggle shadow on
      await shadowToggle.click();

      // Shadow controls should now appear
      await expect(page.locator("#shadow-blur")).toBeVisible();
      await expect(page.locator("#shadow-offset-x")).toBeVisible();
      await expect(page.locator("#shadow-offset-y")).toBeVisible();
      await expect(page.locator("#shadow-color")).toBeVisible();
      await expect(page.locator("#shadow-opacity")).toBeVisible();
    });

    test("shows all preset buttons", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await expect(page.getByText("Polaroid").first()).toBeVisible();
      await expect(page.getByText("Vintage").first()).toBeVisible();
      await expect(page.getByText("Minimal").first()).toBeVisible();
      await expect(page.getByText("Cinematic").first()).toBeVisible();
    });

    test("border width slider is interactive", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      const slider = page.locator("#border-width");
      await expect(slider).toBeVisible();
      await expect(slider).toHaveAttribute("type", "range");
    });

    test("clicking a preset updates border settings", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      // Click Polaroid preset
      await page.getByText("Polaroid").first().click();
      // Click Gallery Black preset
      await page.getByText("Gallery Black").first().click();
    });

    test("submit disabled without file, enabled with file", async ({ loggedInPage: page }) => {
      await page.goto("/border");

      const submitBtn = page.getByTestId("border-submit");
      await expect(submitBtn).toBeDisabled();

      await uploadTestImage(page);
      await expect(submitBtn).toBeEnabled();
    });

    test("processes border and shows download", async ({ loggedInPage: page }) => {
      await page.goto("/border");
      await uploadTestImage(page);

      await page.getByTestId("border-submit").click();
      await waitForProcessing(page);

      await expect(page.getByTestId("border-download")).toBeVisible({ timeout: 15_000 });
    });
  });
});
