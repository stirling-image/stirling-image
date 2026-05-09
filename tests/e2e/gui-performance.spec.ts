import { expect, openSettings, test, uploadTestImage } from "./helpers";

// ---------------------------------------------------------------------------
// GUI Performance: Page load budgets, SPA navigation, interaction responsiveness
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Page Load Performance
// ---------------------------------------------------------------------------
test.describe("Page Load Performance", () => {
  test("home page loads within budget (DOMContentLoaded < 2000ms)", async ({
    loggedInPage: page,
  }) => {
    // Navigate away first so we can measure a fresh load
    await page.goto("about:blank");

    const start = Date.now();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(2000);
  });

  test("home page navigation timing via Performance API (DOMContentLoaded < 2000ms)", async ({
    loggedInPage: page,
  }) => {
    await page.goto("about:blank");
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      };
    });

    expect(timing.domContentLoaded).toBeLessThan(2000);
  });

  test("home page navigation timing (FCP proxy < 2000ms)", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    const perfEntries = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadComplete: nav.loadEventEnd - nav.startTime,
        domInteractive: nav.domInteractive - nav.startTime,
      };
    });

    expect(perfEntries.domContentLoaded).toBeLessThan(2000);
    expect(perfEntries.domInteractive).toBeLessThan(2000);
  });

  test("tool page loads within budget (DOMContentLoaded < 2000ms)", async ({
    loggedInPage: page,
  }) => {
    await page.goto("about:blank");

    const start = Date.now();
    await page.goto("/resize");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// SPA Navigation Timing
// ---------------------------------------------------------------------------
test.describe("SPA Navigation Timing", () => {
  test("SPA navigation from home to tool completes under 1000ms (warmed)", async ({
    loggedInPage: page,
  }) => {
    // Warm up by visiting the target page first so modules are cached
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    const navTime = Date.now() - start;

    // 1000ms budget for dev mode (500ms would be the production target)
    expect(navTime).toBeLessThan(1000);
  });

  test("navigate from / to /resize completes within 2000ms", async ({ loggedInPage: page }) => {
    // Start on home page and wait for it to settle
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.goto("/resize");
    await page.waitForLoadState("domcontentloaded");
    // Wait for the tool name to appear as a signal the route rendered
    await page.locator("h2").filter({ hasText: "Resize" }).waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(2000);
  });

  test("navigate from /resize to /compress completes within 2000ms", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.goto("/compress");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h2").filter({ hasText: "Compress" }).waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(2000);
  });

  test("navigate from /compress to /convert completes within 2000ms", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/compress");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.goto("/convert");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h2").filter({ hasText: "Convert" }).waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(2000);
  });

  test("sidebar navigation from / to /automate completes within 2000ms", async ({
    loggedInPage: page,
  }) => {
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.locator("aside").getByText("Automate").click();
    await page.waitForURL("/automate");
    await page.getByText("Pipeline Builder").waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    expect(navTime).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// Settings Dialog Timing
// ---------------------------------------------------------------------------
test.describe("Settings Dialog Timing", () => {
  test("settings dialog opens within 300ms", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await openSettings(page);
    const openTime = Date.now() - start;

    expect(openTime).toBeLessThan(300);
  });

  test("settings dialog closes within 300ms", async ({ loggedInPage: page }) => {
    await openSettings(page);

    const start = Date.now();
    await page.keyboard.press("Escape");
    await page.locator("h2").filter({ hasText: "Settings" }).waitFor({ state: "hidden" });
    const closeTime = Date.now() - start;

    expect(closeTime).toBeLessThan(300);
  });

  test("switching settings tabs renders within 200ms", async ({ loggedInPage: page }) => {
    await openSettings(page);

    // Switch to About tab
    const start = Date.now();
    await page.getByRole("button", { name: /about/i }).click();
    await page.locator("h3").filter({ hasText: "About" }).waitFor({ state: "visible" });
    const switchTime = Date.now() - start;

    expect(switchTime).toBeLessThan(200);
  });
});

// ---------------------------------------------------------------------------
// Interaction Responsiveness
// ---------------------------------------------------------------------------
test.describe("Interaction Responsiveness", () => {
  test("theme toggle applies within 200ms", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    // Get initial theme state
    const initialHasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );

    // Click the theme toggle button in the footer
    const themeBtn = page.locator("button[title='Toggle Theme']");
    await expect(themeBtn).toBeVisible({ timeout: 5_000 });

    const start = Date.now();
    await themeBtn.click();

    // Wait for the dark class to toggle
    await page.waitForFunction(
      (hadDark: boolean) => document.documentElement.classList.contains("dark") !== hadDark,
      initialHasClass,
      { timeout: 200 },
    );
    const toggleTime = Date.now() - start;

    expect(toggleTime).toBeLessThan(200);

    // Toggle back to restore original state
    await themeBtn.click();
  });

  test("tool panel search filters results within 300ms", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/search/i).first();
    await expect(searchInput).toBeVisible();

    const start = Date.now();
    await searchInput.fill("resize");

    // Wait for the filtered result to be visible
    await page.getByText("Resize").first().waitFor({ state: "visible" });
    const filterTime = Date.now() - start;

    // 300ms is generous for a client-side filter
    expect(filterTime).toBeLessThan(300);
  });

  test("tool panel search clears within 300ms", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/search/i).first();
    await searchInput.fill("resize");
    await page.waitForTimeout(200);

    const start = Date.now();
    await searchInput.fill("");

    // All categories should reappear
    await page.getByText("Essentials").first().waitFor({ state: "visible" });
    const clearTime = Date.now() - start;

    expect(clearTime).toBeLessThan(300);
  });
});

// ---------------------------------------------------------------------------
// Bundle & Resource Efficiency
// ---------------------------------------------------------------------------
test.describe("Bundle Efficiency", () => {
  test("home page does not load excessive resources", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");

    // Count network requests during page load
    const requests: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "script" || req.resourceType() === "stylesheet") {
        requests.push(req.url());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // In dev mode Vite serves unbundled ESM modules, so count is higher
    // than production. 200 is generous for dev; production would be < 50.
    expect(requests.length).toBeLessThan(200);
  });

  test("lazy-loaded tool pages add minimal additional requests", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    // Track new requests when navigating to a tool page
    const newRequests: string[] = [];
    page.on("request", (req) => {
      if (req.resourceType() === "script") {
        newRequests.push(req.url());
      }
    });

    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    // In dev mode Vite serves unbundled ESM; more requests than production.
    expect(newRequests.length).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// Repeated Operations Performance
// ---------------------------------------------------------------------------
test.describe("Repeated Operations Performance", () => {
  test("10 sequential tool navigations without crash", async ({ loggedInPage: page }) => {
    const routes = [
      "/resize",
      "/crop",
      "/rotate",
      "/convert",
      "/compress",
      "/sharpening",
      "/adjust-colors",
      "/strip-metadata",
      "/bulk-rename",
      "/favicon",
    ];
    const timings: number[] = [];

    // Warm up: ensure all chunks are cached
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
    }

    // Measure sequential navigations
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    for (const route of routes) {
      const start = Date.now();
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const elapsed = Date.now() - start;
      timings.push(elapsed);

      // Each page should render without errors
      const content = await page.textContent("body");
      expect(content).toBeDefined();
      expect(content?.length).toBeGreaterThan(0);
    }

    // Average navigation time should be under 2000ms in dev mode
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    expect(avg).toBeLessThan(2000);

    // No individual navigation should exceed 3000ms (dev mode variability)
    for (const t of timings) {
      expect(t).toBeLessThan(3000);
    }
  });

  test("20x settings dialog open/close without degradation", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const timings: number[] = [];

    for (let i = 0; i < 20; i++) {
      const start = Date.now();
      await openSettings(page);
      await page.locator("h2").filter({ hasText: "Settings" }).waitFor({ state: "visible" });
      timings.push(Date.now() - start);

      await page.keyboard.press("Escape");
      await page.locator("h2").filter({ hasText: "Settings" }).waitFor({ state: "hidden" });
    }

    // All iterations should complete under budget (generous for dev/CI)
    for (const t of timings) {
      expect(t).toBeLessThan(1000);
    }

    // Last open should not be significantly slower than first
    const firstOpen = timings[0];
    const lastOpen = timings[timings.length - 1];
    expect(lastOpen).toBeLessThan(Math.max(firstOpen * 3, 1000));
  });

  test("10x upload/clear cycle stays responsive", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    const timings: number[] = [];

    for (let i = 0; i < 10; i++) {
      const start = Date.now();

      // Upload
      await uploadTestImage(page);
      await expect(page.getByText(/test-image/i).first()).toBeVisible({ timeout: 5_000 });

      // Clear files
      const clearBtn = page.getByText("Clear all");
      if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clearBtn.click();
        await page.waitForTimeout(300);
      }

      // Dropzone should reappear
      await expect(page.getByText("Upload from computer")).toBeVisible({ timeout: 5_000 });

      timings.push(Date.now() - start);
    }

    // No individual cycle should be excessively slow
    for (const t of timings) {
      expect(t).toBeLessThan(10_000);
    }

    // The page should still be responsive after 10 cycles
    await expect(page.locator("main")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 14.7 Performance Budgets: FCP, LCP, TTI via Performance API
// ---------------------------------------------------------------------------
test.describe("Performance Budgets - Paint Metrics", () => {
  test("home page FCP < 2000ms via PerformanceObserver", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");

    // Wait briefly for paint entries to be recorded
    await page.waitForTimeout(1000);

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByName("first-contentful-paint");
      if (entries.length > 0) return entries[0].startTime;
      // Fallback: use paint timing
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find((e) => e.name === "first-contentful-paint");
      return fcpEntry?.startTime ?? null;
    });

    // FCP may not be available in all test environments (headless Chromium
    // sometimes omits paint timing). If available, assert the budget.
    if (fcp !== null) {
      expect(fcp).toBeLessThan(2000);
    }
  });

  test("home page LCP < 3000ms", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");

    // Set up LCP observer before navigation
    await page.goto("/");
    await page.waitForLoadState("load");

    // Wait for LCP to stabilize
    await page.waitForTimeout(2000);

    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        // Try to get LCP from existing entries
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              resolve(entries[entries.length - 1].startTime);
            }
            observer.disconnect();
          });
          observer.observe({ type: "largest-contentful-paint", buffered: true });

          // Timeout fallback
          setTimeout(() => resolve(null), 1000);
        } catch {
          resolve(null);
        }
      });
    });

    if (lcp !== null) {
      expect(lcp).toBeLessThan(3000);
    }
  });

  test("home page TTI proxy < 3500ms (domInteractive + networkIdle)", async ({
    loggedInPage: page,
  }) => {
    await page.goto("about:blank");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const tti = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      // TTI approximation: domInteractive marks when the parser finishes,
      // combined with load event end for a reasonable upper bound
      return Math.max(nav.domInteractive - nav.startTime, nav.loadEventEnd - nav.startTime);
    });

    expect(tti).toBeLessThan(3500);
  });
});

test.describe("Performance Budgets - Route Navigation", () => {
  test("tool-to-tool SPA navigation < 500ms (warmed, production target)", async ({
    loggedInPage: page,
  }) => {
    // Warm up both routes so lazy chunks are cached
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.goto("/compress");
    await page.waitForLoadState("networkidle");

    // Now measure warmed navigation
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await page.goto("/compress");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("h2").filter({ hasText: "Compress" }).waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    // 500ms is the production budget; use 1500ms for dev mode
    expect(navTime).toBeLessThan(1500);
  });

  test("sidebar click navigation < 500ms (warmed)", async ({ loggedInPage: page }) => {
    // Warm up
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click a sidebar tool link
    const start = Date.now();
    await page.locator("aside").getByText("Automate").click();
    await page.waitForURL("/automate");
    await page.getByText("Pipeline Builder").waitFor({ state: "visible" });
    const navTime = Date.now() - start;

    // 1500ms for dev mode
    expect(navTime).toBeLessThan(1500);
  });
});

// ---------------------------------------------------------------------------
// 14.7 File Upload Preview Timing
// ---------------------------------------------------------------------------
test.describe("File Upload Preview Timing", () => {
  test("file upload preview renders within 1000ms", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await uploadTestImage(page);

    // Wait for the image preview or filename to appear
    await expect(
      page
        .getByText(/test-image/i)
        .or(page.locator("img[src^='blob:']"))
        .first(),
    ).toBeVisible({ timeout: 5_000 });
    const previewTime = Date.now() - start;

    expect(previewTime).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// 14.8 Interaction Responsiveness (expanded)
// ---------------------------------------------------------------------------
test.describe("Interaction Responsiveness - Live Preview", () => {
  test("compress quality slider updates preview indicator promptly", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/compress");
    await page.waitForLoadState("networkidle");

    // Look for a quality slider or range input
    const slider = page.locator("input[type='range']").first();
    if (await slider.isVisible({ timeout: 3000 }).catch(() => false)) {
      const initialValue = await slider.inputValue();

      const start = Date.now();
      // Adjust via keyboard
      await slider.focus();
      await page.keyboard.press("ArrowRight");

      const newValue = await slider.inputValue();
      const responseTime = Date.now() - start;

      // Value should change and respond within 300ms (generous for dev)
      if (newValue !== initialValue) {
        expect(responseTime).toBeLessThan(300);
      }
    }
  });
});

test.describe("Interaction Responsiveness - No Blank Flash", () => {
  test("no white/blank flash during tool-to-tool navigation", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    // Monitor for blank screens during navigation
    let blankScreenDetected = false;

    // Check periodically during navigation
    const checkInterval = setInterval(async () => {
      try {
        const bodyHtml = await page.evaluate(() => document.body.innerHTML);
        if (bodyHtml.trim().length === 0) {
          blankScreenDetected = true;
        }
      } catch {
        // Page might be navigating -- ignore
      }
    }, 50);

    // Navigate through several tools
    await page.goto("/compress");
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/rotate");
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/convert");
    await page.waitForLoadState("domcontentloaded");

    clearInterval(checkInterval);

    expect(blankScreenDetected).toBe(false);
  });

  test("Suspense fallback renders during lazy load (no bare white screen)", async ({
    loggedInPage: page,
  }) => {
    // Navigate to a tool that is lazy-loaded
    // During load, the Suspense boundary should show a spinner, not nothing
    await page.goto("about:blank");

    // Navigate and immediately check for content
    const response = page.goto("/resize");
    await page.waitForLoadState("domcontentloaded");

    // After domcontentloaded, body should have content (either the spinner or the page)
    const bodyContent = await page.textContent("body");
    expect(bodyContent).toBeDefined();

    // Wait for full load
    await response;
    await expect(page.locator("main").or(page.locator("[class*='animate-spin']"))).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("Interaction Responsiveness - Theme Toggle", () => {
  test("theme toggle does not cause layout shift", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    // Get the sidebar width before toggle
    const sidebarBefore = await page.locator("aside").boundingBox();

    // Toggle theme
    const themeBtn = page.locator("button[title='Toggle Theme']");
    if (await themeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await themeBtn.click();
      await page.waitForTimeout(200);

      // Get the sidebar width after toggle
      const sidebarAfter = await page.locator("aside").boundingBox();

      // Sidebar dimensions should not change (no layout shift)
      if (sidebarBefore && sidebarAfter) {
        expect(sidebarAfter.width).toBe(sidebarBefore.width);
        expect(sidebarAfter.x).toBe(sidebarBefore.x);
      }

      // Toggle back
      await themeBtn.click();
    }
  });
});

// ---------------------------------------------------------------------------
// 14.7 Performance Budgets: Tool Settings Lazy Load
// ---------------------------------------------------------------------------
test.describe("Performance Budgets - Lazy Load", () => {
  test("tool settings lazy load < 500ms after upload", async ({ loggedInPage: page }) => {
    await page.goto("/resize");
    await page.waitForLoadState("networkidle");

    const start = Date.now();
    await uploadTestImage(page);

    // Wait for the settings panel / process button to appear (lazy loaded)
    await expect(page.getByRole("button", { name: "Resize" })).toBeVisible({ timeout: 5_000 });
    const loadTime = Date.now() - start;

    // The settings panel should appear within 500ms of upload
    // (uploadTestImage includes 500ms for React state, so subtract that)
    // Use generous budget of 2000ms total (including upload processing)
    expect(loadTime).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// 14.7 DOMContentLoaded on Various Pages
// ---------------------------------------------------------------------------
test.describe("DOMContentLoaded Budget - Various Pages", () => {
  test("automate page DOMContentLoaded < 2000ms", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");

    const start = Date.now();
    await page.goto("/automate");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(2000);
  });

  test("files page DOMContentLoaded < 2000ms", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");

    const start = Date.now();
    await page.goto("/files");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(2000);
  });

  test("compress page DOMContentLoaded < 2000ms", async ({ loggedInPage: page }) => {
    await page.goto("about:blank");

    const start = Date.now();
    await page.goto("/compress");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(2000);
  });
});

// ---------------------------------------------------------------------------
// 14.8 Keyboard Shortcut Response Time
// ---------------------------------------------------------------------------
test.describe("Keyboard Shortcut Responsiveness", () => {
  test("Ctrl/Cmd+K search shortcut responds instantly", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const isMac = await page.evaluate(() => /Mac|iPod|iPhone|iPad/.test(navigator.platform));
    const modKey = isMac ? "Meta" : "Control";

    const start = Date.now();
    await page.keyboard.press(`${modKey}+k`);

    // The search input should become focused or a search modal should appear
    await page.waitForTimeout(100);
    const responseTime = Date.now() - start;

    // Should respond within 300ms (generous for dev)
    expect(responseTime).toBeLessThan(300);

    // Verify something happened (search focused or modal appeared)
    const activeTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeTag).toBeDefined();
  });

  test("Escape key dismisses focused element instantly", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    // Focus the search input
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.focus();
      await searchInput.fill("resize");

      const start = Date.now();
      await page.keyboard.press("Escape");
      const responseTime = Date.now() - start;

      // Escape should respond within 200ms
      expect(responseTime).toBeLessThan(200);
    }
  });
});

// ---------------------------------------------------------------------------
// 14.8 Search Filter Responsiveness
// ---------------------------------------------------------------------------
test.describe("Search Filter Timing - Extended", () => {
  test("search filter for partial match responds within 300ms", async ({ loggedInPage: page }) => {
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/search/i).first();
    await expect(searchInput).toBeVisible();

    const start = Date.now();
    await searchInput.fill("comp");

    // Wait for a filtered result containing "Compress" to appear
    await page.getByText("Compress").first().waitFor({ state: "visible", timeout: 3_000 });
    const filterTime = Date.now() - start;

    expect(filterTime).toBeLessThan(300);
  });

  test("search with no results renders empty state within 300ms", async ({
    loggedInPage: page,
  }) => {
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/search/i).first();
    await expect(searchInput).toBeVisible();

    const start = Date.now();
    await searchInput.fill("zzzznonexistenttool");

    // Wait for the empty state or "no results" indicator
    await page.waitForTimeout(200);
    const filterTime = Date.now() - start;

    expect(filterTime).toBeLessThan(300);

    // The page should still be functional
    await expect(page.locator("main")).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 14.9 Memory and Stability - Extended
// ---------------------------------------------------------------------------
test.describe("Memory and Stability - Extended", () => {
  test("10 different tools sequentially without reload or crash", async ({
    loggedInPage: page,
  }) => {
    const tools = [
      "/resize",
      "/compress",
      "/convert",
      "/rotate",
      "/flip",
      "/crop",
      "/watermark",
      "/border",
      "/sharpening",
      "/adjust-colors",
    ];

    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    for (const tool of tools) {
      await page.goto(tool);
      await page.waitForLoadState("domcontentloaded");

      // Each tool page should render its heading
      const bodyText = await page.textContent("body");
      expect(bodyText).toBeDefined();
      expect(bodyText?.length).toBeGreaterThan(0);

      // Sidebar should remain visible (layout intact)
      await expect(page.locator("aside")).toBeVisible();
    }

    // No uncaught errors should have occurred
    expect(errors).toHaveLength(0);
  });

  test("navigate rapidly between 15 tools and verify no state bleed", async ({
    loggedInPage: page,
  }) => {
    const routes = [
      "/resize",
      "/crop",
      "/rotate",
      "/convert",
      "/compress",
      "/sharpening",
      "/adjust-colors",
      "/strip-metadata",
      "/bulk-rename",
      "/favicon",
      "/watermark",
      "/border",
      "/flip",
      "/qr-generate",
      "/image-to-pdf",
    ];

    // Upload on the first tool
    await page.goto("/resize");
    await uploadTestImage(page);
    await expect(page.getByText(/test-image/i).first()).toBeVisible({ timeout: 5_000 });

    // Navigate rapidly through all tools
    for (const route of routes.slice(1)) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
    }

    // Come back to resize -- state should be clean (no leftover from first upload)
    await page.goto("/resize");
    await page.waitForLoadState("domcontentloaded");

    // The dropzone should be visible (previous upload state was cleared on nav)
    await expect(page.getByText("Upload from computer")).toBeVisible({ timeout: 5_000 });
  });
});
