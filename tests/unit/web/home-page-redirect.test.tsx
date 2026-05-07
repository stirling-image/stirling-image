// @vitest-environment jsdom
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let settingsState = {
  fetch: vi.fn(),
  defaultToolView: "sidebar" as "sidebar" | "fullscreen",
  loaded: false,
};

vi.mock("@/stores/settings-store", () => ({
  useSettingsStore: () => settingsState,
}));

let fileState = {
  setFiles: vi.fn(),
  files: [] as File[],
  reset: vi.fn(),
  originalBlobUrl: null as string | null,
  selectedFileName: null as string | null,
  selectedFileSize: 0,
  currentEntry: null,
};

vi.mock("@/stores/file-store", () => ({
  useFileStore: () => fileState,
}));

vi.mock("@/stores/features-store", () => ({
  useFeaturesStore: () => ({
    fetch: vi.fn(),
    bundles: [],
    installing: {},
    queued: [],
  }),
}));

vi.mock("@/components/layout/app-layout", () => ({
  AppLayout: ({ children }: React.PropsWithChildren) => (
    <div data-testid="app-layout">{children}</div>
  ),
}));

vi.mock("@/components/common/image-viewer", () => ({
  ImageViewer: () => null,
}));

vi.mock("@/components/common/multi-image-viewer", () => ({
  MultiImageViewer: () => null,
}));

vi.mock("@/lib/icon-map", () => ({
  ICON_MAP: new Proxy(
    {},
    {
      get: () => (props: { className?: string }) => <span {...props} />,
    },
  ),
}));

import { act, cleanup, render } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { HomePage } from "@/pages/home-page";

let currentPath = "/";

function LocationSpy() {
  const location = useLocation();
  currentPath = location.pathname;
  return null;
}

function renderInRouter(initialPath = "/") {
  currentPath = initialPath;
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationSpy />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/fullscreen" element={<div data-testid="fullscreen-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

// Tests are ordered intentionally: the module-level `hasAppliedDefaultRedirect`
// flag starts false and is set true by the "redirects on first mount" test.
// Tests before it verify conditions that independently prevent the redirect
// (so the flag stays false). The final test verifies the flag prevents repeat redirects.
describe("HomePage default view redirect", () => {
  beforeEach(() => {
    settingsState = {
      fetch: vi.fn(),
      defaultToolView: "sidebar",
      loaded: false,
    };
    fileState = {
      setFiles: vi.fn(),
      files: [],
      reset: vi.fn(),
      originalBlobUrl: null,
      selectedFileName: null,
      selectedFileSize: 0,
      currentEntry: null,
    };
  });

  it("does NOT redirect when settings have not loaded yet", () => {
    settingsState.loaded = false;
    settingsState.defaultToolView = "fullscreen";

    renderInRouter("/");

    expect(currentPath).toBe("/");
  });

  it("does NOT redirect when default view is sidebar", () => {
    settingsState.loaded = true;
    settingsState.defaultToolView = "sidebar";

    renderInRouter("/");

    expect(currentPath).toBe("/");
  });

  it("does NOT redirect when files are loaded even with fullscreen default", () => {
    settingsState.loaded = true;
    settingsState.defaultToolView = "fullscreen";
    fileState.files = [new File([new ArrayBuffer(1024)], "test.png", { type: "image/png" })];
    fileState.originalBlobUrl = "blob:fake-url";
    fileState.selectedFileName = "test.png";
    fileState.selectedFileSize = 1024;

    renderInRouter("/");

    expect(currentPath).toBe("/");
  });

  it("redirects to /fullscreen on first mount when default view is fullscreen", () => {
    settingsState.loaded = true;
    settingsState.defaultToolView = "fullscreen";

    renderInRouter("/");

    expect(currentPath).toBe("/fullscreen");
  });

  it("does NOT redirect on subsequent mounts after initial redirect (issue #128)", () => {
    settingsState.loaded = true;
    settingsState.defaultToolView = "fullscreen";

    renderInRouter("/");

    expect(currentPath).toBe("/");
  });
});
