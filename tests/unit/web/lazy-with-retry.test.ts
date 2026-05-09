// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/stores/connection-store", () => ({
  useConnectionStore: { getState: () => ({ setDisconnected: vi.fn() }) },
}));

import { isChunkError, lazyWithRetry, retryDynamicImport } from "@/lib/lazy-with-retry";

describe("retryDynamicImport", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves on first success", async () => {
    const mod = { default: () => null };
    const importFn = vi.fn().mockResolvedValue(mod);
    const result = await retryDynamicImport(importFn);
    expect(result).toBe(mod);
    expect(importFn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and resolves on eventual success", async () => {
    const mod = { default: () => null };
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch dynamically imported module"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch dynamically imported module"))
      .mockResolvedValue(mod);
    const promise = retryDynamicImport(importFn, 3, 100);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe(mod);
    expect(importFn).toHaveBeenCalledTimes(3);
  });

  it("rejects after all retries exhausted", async () => {
    const err = new TypeError("Failed to fetch dynamically imported module");
    const importFn = vi.fn().mockRejectedValue(err);
    const promise = retryDynamicImport(importFn, 3, 100);
    promise.catch(() => {});
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow("Failed to fetch dynamically imported module");
    expect(importFn).toHaveBeenCalledTimes(3);
  });

  it("retries CSS preload errors", async () => {
    const mod = { default: () => null };
    const importFn = vi
      .fn()
      .mockRejectedValueOnce(
        new TypeError("Unable to preload CSS for /assets/tool-page-DDbXBANV.css"),
      )
      .mockResolvedValue(mod);
    const promise = retryDynamicImport(importFn, 3, 100);
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe(mod);
    expect(importFn).toHaveBeenCalledTimes(2);
  });

  it("only retries chunk-related errors, not other errors", async () => {
    const err = new Error("Some other error");
    const importFn = vi.fn().mockRejectedValue(err);
    await expect(retryDynamicImport(importFn, 3, 100)).rejects.toThrow("Some other error");
    expect(importFn).toHaveBeenCalledTimes(1);
  });
});

describe("isChunkError", () => {
  it("returns false for non-Error values", () => {
    expect(isChunkError("string")).toBe(false);
    expect(isChunkError(null)).toBe(false);
    expect(isChunkError(undefined)).toBe(false);
    expect(isChunkError(42)).toBe(false);
  });

  it("returns true for dynamically imported module error", () => {
    expect(isChunkError(new Error("Failed to fetch dynamically imported module /foo.js"))).toBe(
      true,
    );
  });

  it("returns true for loading chunk error", () => {
    expect(isChunkError(new Error("Loading chunk 123 failed"))).toBe(true);
  });

  it("returns true for loading CSS chunk error", () => {
    expect(isChunkError(new Error("Loading CSS chunk abc-def failed"))).toBe(true);
  });

  it("returns true for failed to fetch error", () => {
    expect(isChunkError(new TypeError("Failed to fetch"))).toBe(true);
  });

  it("returns true for unable to preload error", () => {
    expect(isChunkError(new Error("Unable to preload CSS for /assets/foo.css"))).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isChunkError(new Error("Something else went wrong"))).toBe(false);
    expect(isChunkError(new Error("Network timeout"))).toBe(false);
  });
});

describe("lazyWithRetry", () => {
  it("returns a React lazy component", () => {
    const Comp = () => null;
    const importFn = vi.fn().mockResolvedValue({ default: Comp });
    const LazyComp = lazyWithRetry(importFn as any);
    // React.lazy returns an object with $$typeof symbol
    expect(LazyComp).toBeDefined();
    expect(typeof LazyComp).toBe("object");
  });
});
