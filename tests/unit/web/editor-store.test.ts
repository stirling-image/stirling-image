// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// Bypass zustand persist middleware
vi.mock("zustand/middleware", async (importOriginal) => {
  const actual: Record<string, unknown> = await importOriginal();
  return { ...actual, persist: (config: unknown) => config };
});

// ---------------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------------

import { useEditorStore } from "@/stores/editor-store";
import type { CanvasObject, CropState, SelectionState, ToolType } from "@/types/editor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function state() {
  return useEditorStore.getState();
}

function act<T>(fn: (s: ReturnType<typeof state>) => T): T {
  return fn(state());
}

function makeRect(
  overrides: Partial<{ id: string; layerId: string; x: number; y: number }> = {},
): CanvasObject {
  return {
    id: overrides.id ?? "obj-1",
    type: "rect",
    layerId: overrides.layerId ?? state().activeLayerId,
    attrs: {
      x: overrides.x ?? 10,
      y: overrides.y ?? 20,
      width: 100,
      height: 50,
      fill: "#ff0000",
      stroke: "#000000",
      strokeWidth: 1,
      cornerRadius: 0,
      rotation: 0,
      opacity: 1,
    },
  };
}

function makeLine(overrides: Partial<{ id: string; layerId: string }> = {}): CanvasObject {
  return {
    id: overrides.id ?? "line-1",
    type: "line",
    layerId: overrides.layerId ?? state().activeLayerId,
    attrs: {
      points: [0, 0, 100, 100],
      stroke: "#000",
      strokeWidth: 2,
      tension: 0,
      lineCap: "round",
      lineJoin: "round",
      opacity: 1,
      globalCompositeOperation: "source-over",
    },
  };
}

function makeText(
  overrides: Partial<{ id: string; layerId: string; x: number; y: number }> = {},
): CanvasObject {
  return {
    id: overrides.id ?? "text-1",
    type: "text",
    layerId: overrides.layerId ?? state().activeLayerId,
    attrs: {
      x: overrides.x ?? 50,
      y: overrides.y ?? 60,
      text: "Hello",
      fontFamily: "Arial",
      fontSize: 16,
      fontStyle: "normal",
      fontVariant: "normal",
      textDecoration: "",
      align: "left",
      fill: "#000",
      lineHeight: 1.2,
      letterSpacing: 0,
      rotation: 0,
      opacity: 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Reset store between tests
// ---------------------------------------------------------------------------

// Capture the initial state snapshot once, then restore it per-test.
const INITIAL = useEditorStore.getState();

beforeEach(() => {
  useEditorStore.setState({ ...INITIAL }, true);
});

// ===========================================================================
// Tool Management
// ===========================================================================

describe("Tool Management", () => {
  it("default tool is move", () => {
    expect(state().activeTool).toBe("move");
  });

  it("setTool changes activeTool", () => {
    act((s) => s.setTool("brush"));
    expect(state().activeTool).toBe("brush");
  });

  it("setTool stores previousTool", () => {
    act((s) => s.setTool("brush"));
    expect(state().previousTool).toBe("move");
    act((s) => s.setTool("eraser"));
    expect(state().previousTool).toBe("brush");
  });

  it("setTool to crop sets isCropping true", () => {
    act((s) => s.setTool("crop"));
    expect(state().isCropping).toBe(true);
  });

  it("setTool to non-crop sets isCropping false", () => {
    act((s) => s.setTool("crop"));
    act((s) => s.setTool("move"));
    expect(state().isCropping).toBe(false);
  });

  it("previousTool starts as null", () => {
    expect(state().previousTool).toBeNull();
  });
});

// ===========================================================================
// Canvas State
// ===========================================================================

describe("Canvas State", () => {
  it("default canvas size is 1920x1080", () => {
    expect(state().canvasSize).toEqual({ width: 1920, height: 1080 });
  });

  it("setZoom updates zoom", () => {
    act((s) => s.setZoom(2));
    expect(state().zoom).toBe(2);
  });

  it("setZoom clamps to minimum 0.01", () => {
    act((s) => s.setZoom(0.001));
    expect(state().zoom).toBe(0.01);
  });

  it("setZoom clamps to maximum 64", () => {
    act((s) => s.setZoom(100));
    expect(state().zoom).toBe(64);
  });

  it("setZoom clamps negative values to minimum", () => {
    act((s) => s.setZoom(-5));
    expect(state().zoom).toBe(0.01);
  });

  it("setPanOffset updates offset", () => {
    act((s) => s.setPanOffset({ x: 100, y: -50 }));
    expect(state().panOffset).toEqual({ x: 100, y: -50 });
  });

  it("loadImage sets sourceImageUrl", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    expect(state().sourceImageUrl).toBe("blob:test");
  });

  it("loadImage sets sourceImageSize", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    expect(state().sourceImageSize).toEqual({ width: 800, height: 600 });
  });

  it("loadImage updates canvasSize to image dimensions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    expect(state().canvasSize).toEqual({ width: 800, height: 600 });
  });

  it("loadImage resets zoom and panOffset", () => {
    act((s) => s.setZoom(3));
    act((s) => s.setPanOffset({ x: 50, y: 50 }));
    act((s) => s.loadImage("blob:test", 800, 600));
    expect(state().zoom).toBe(1);
    expect(state().panOffset).toEqual({ x: 0, y: 0 });
  });

  it("resizeCanvas updates canvasSize", () => {
    act((s) => s.resizeCanvas(500, 400, "center"));
    expect(state().canvasSize).toEqual({ width: 500, height: 400 });
  });

  it("resizeCanvas marks dirty", () => {
    act((s) => s.resizeCanvas(500, 400, "center"));
    expect(state().isDirty).toBe(true);
  });

  it("resizeImage updates both canvasSize and sourceImageSize", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.resizeImage(400, 300));
    expect(state().canvasSize).toEqual({ width: 400, height: 300 });
    expect(state().sourceImageSize).toEqual({ width: 400, height: 300 });
  });
});

// ===========================================================================
// Layer Management
// ===========================================================================

describe("Layer Management", () => {
  it("starts with one layer named Layer 1", () => {
    expect(state().layers).toHaveLength(1);
    expect(state().layers[0].name).toBe("Layer 1");
  });

  it("default layer is active", () => {
    expect(state().activeLayerId).toBe(state().layers[0].id);
  });

  it("addLayer creates a new layer", () => {
    act((s) => s.addLayer());
    expect(state().layers).toHaveLength(2);
  });

  it("addLayer inserts above active layer", () => {
    act((s) => s.addLayer());
    // New layer should be at index 1 (after the active layer at index 0)
    expect(state().layers).toHaveLength(2);
    expect(state().activeLayerId).toBe(state().layers[1].id);
  });

  it("addLayer auto-increments name", () => {
    act((s) => s.addLayer());
    const names = state().layers.map((l) => l.name);
    expect(names[1]).toMatch(/^Layer \d+$/);
  });

  it("addLayer sets new layer as active", () => {
    const oldActiveId = state().activeLayerId;
    act((s) => s.addLayer());
    expect(state().activeLayerId).not.toBe(oldActiveId);
  });

  it("addLayer marks isDirty", () => {
    act((s) => s.addLayer());
    expect(state().isDirty).toBe(true);
  });

  it("removeLayer deletes the layer", () => {
    act((s) => s.addLayer());
    const idToRemove = state().layers[1].id;
    act((s) => s.removeLayer(idToRemove));
    expect(state().layers).toHaveLength(1);
    expect(state().layers.find((l) => l.id === idToRemove)).toBeUndefined();
  });

  it("removeLayer also removes objects belonging to that layer", () => {
    act((s) => s.addLayer());
    const layerId = state().layers[1].id;
    act((s) => s.addObject(makeRect({ id: "obj-in-layer", layerId })));
    act((s) => s.removeLayer(layerId));
    expect(state().objects.find((o) => o.layerId === layerId)).toBeUndefined();
  });

  it("removeLayer prevents deleting the last layer", () => {
    const soleId = state().layers[0].id;
    act((s) => s.removeLayer(soleId));
    expect(state().layers).toHaveLength(1);
  });

  it("removeLayer selects adjacent layer when active is removed", () => {
    act((s) => s.addLayer());
    const secondId = state().layers[1].id;
    act((s) => s.setActiveLayer(secondId));
    act((s) => s.removeLayer(secondId));
    expect(state().activeLayerId).toBe(state().layers[0].id);
  });

  it("removeLayer keeps activeLayerId when non-active is removed", () => {
    act((s) => s.addLayer());
    const firstId = state().layers[0].id;
    const secondId = state().layers[1].id;
    act((s) => s.setActiveLayer(firstId));
    act((s) => s.removeLayer(secondId));
    expect(state().activeLayerId).toBe(firstId);
  });

  it("duplicateLayer creates copy with (copy) suffix", () => {
    const srcId = state().layers[0].id;
    act((s) => s.duplicateLayer(srcId));
    expect(state().layers).toHaveLength(2);
    expect(state().layers[1].name).toBe("Layer 1 (copy)");
  });

  it("duplicateLayer copies objects to new layer", () => {
    const srcId = state().layers[0].id;
    act((s) => s.addObject(makeRect({ id: "src-obj", layerId: srcId })));
    act((s) => s.duplicateLayer(srcId));
    const newLayerId = state().layers[1].id;
    const copiedObjects = state().objects.filter((o) => o.layerId === newLayerId);
    expect(copiedObjects).toHaveLength(1);
    expect(copiedObjects[0].id).not.toBe("src-obj");
  });

  it("duplicateLayer sets new layer as active", () => {
    const srcId = state().layers[0].id;
    act((s) => s.duplicateLayer(srcId));
    expect(state().activeLayerId).toBe(state().layers[1].id);
  });

  it("duplicateLayer preserves layer properties", () => {
    const srcId = state().layers[0].id;
    act((s) => s.updateLayer(srcId, { opacity: 0.5, blendMode: "multiply" }));
    act((s) => s.duplicateLayer(srcId));
    const copy = state().layers[1];
    expect(copy.opacity).toBe(0.5);
    expect(copy.blendMode).toBe("multiply");
  });

  it("setActiveLayer changes activeLayerId", () => {
    act((s) => s.addLayer());
    const firstId = state().layers[0].id;
    act((s) => s.setActiveLayer(firstId));
    expect(state().activeLayerId).toBe(firstId);
  });

  it("updateLayer changes name", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { name: "Background" }));
    expect(state().layers[0].name).toBe("Background");
  });

  it("updateLayer changes visibility", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { visible: false }));
    expect(state().layers[0].visible).toBe(false);
  });

  it("updateLayer changes locked", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { locked: true }));
    expect(state().layers[0].locked).toBe(true);
  });

  it("updateLayer changes opacity", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { opacity: 0.3 }));
    expect(state().layers[0].opacity).toBe(0.3);
  });

  it("updateLayer changes blendMode", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { blendMode: "multiply" }));
    expect(state().layers[0].blendMode).toBe("multiply");
  });

  it("reorderLayers moves layer from one index to another", () => {
    act((s) => s.addLayer());
    act((s) => s.addLayer());
    const originalOrder = state().layers.map((l) => l.id);
    act((s) => s.reorderLayers(0, 2));
    expect(state().layers[2].id).toBe(originalOrder[0]);
  });

  it("mergeDown combines layer into the one below", () => {
    act((s) => s.addLayer());
    const topId = state().layers[1].id;
    const bottomId = state().layers[0].id;
    act((s) => s.addObject(makeRect({ id: "top-obj", layerId: topId })));
    act((s) => s.mergeDown(topId));
    expect(state().layers).toHaveLength(1);
    expect(state().layers[0].id).toBe(bottomId);
    expect(state().objects[0].layerId).toBe(bottomId);
  });

  it("mergeDown does nothing for the bottom layer", () => {
    act((s) => s.addLayer());
    const bottomId = state().layers[0].id;
    act((s) => s.mergeDown(bottomId));
    expect(state().layers).toHaveLength(2);
  });

  it("mergeDown sets active layer to the one below", () => {
    act((s) => s.addLayer());
    const topId = state().layers[1].id;
    const bottomId = state().layers[0].id;
    act((s) => s.mergeDown(topId));
    expect(state().activeLayerId).toBe(bottomId);
  });

  it("flattenAll reduces to single layer", () => {
    act((s) => s.addLayer());
    act((s) => s.addLayer());
    act((s) => s.flattenAll());
    expect(state().layers).toHaveLength(1);
    expect(state().layers[0].name).toBe("Flattened");
  });

  it("flattenAll moves all objects to bottom layer", () => {
    act((s) => s.addLayer());
    const topId = state().layers[1].id;
    const bottomId = state().layers[0].id;
    act((s) => s.addObject(makeRect({ id: "obj-top", layerId: topId })));
    act((s) => s.addObject(makeRect({ id: "obj-bottom", layerId: bottomId })));
    act((s) => s.flattenAll());
    for (const obj of state().objects) {
      expect(obj.layerId).toBe(state().layers[0].id);
    }
  });
});

// ===========================================================================
// Object Management
// ===========================================================================

describe("Object Management", () => {
  it("addObject appends to objects array", () => {
    act((s) => s.addObject(makeRect()));
    expect(state().objects).toHaveLength(1);
  });

  it("addObject assigns active layerId when not specified", () => {
    const activeId = state().activeLayerId;
    const obj = makeRect();
    // Remove layerId to test default assignment
    (obj as { layerId: string }).layerId = "";
    act((s) => s.addObject({ ...obj, layerId: undefined as unknown as string }));
    expect(state().objects[0].layerId).toBe(activeId);
  });

  it("addObject preserves specified layerId", () => {
    act((s) => s.addLayer());
    const secondLayerId = state().layers[1].id;
    act((s) => s.addObject(makeRect({ layerId: secondLayerId })));
    expect(state().objects[0].layerId).toBe(secondLayerId);
  });

  it("addObject marks dirty", () => {
    act((s) => s.addObject(makeRect()));
    expect(state().isDirty).toBe(true);
  });

  it("updateObject modifies attrs", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.updateObject("r1", { width: 200 }));
    const obj = state().objects[0];
    expect(obj.type === "rect" && obj.attrs.width).toBe(200);
  });

  it("updateObject does not affect other objects", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.addObject(makeRect({ id: "r2" })));
    act((s) => s.updateObject("r1", { width: 999 }));
    const r2 = state().objects.find((o) => o.id === "r2");
    expect(r2?.type === "rect" && r2.attrs.width).toBe(100);
  });

  it("removeObjects deletes by ids", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.addObject(makeRect({ id: "r2" })));
    act((s) => s.removeObjects(["r1"]));
    expect(state().objects).toHaveLength(1);
    expect(state().objects[0].id).toBe("r2");
  });

  it("removeObjects clears selection for removed ids", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.removeObjects(["r1"]));
    expect(state().selectedObjectIds).toEqual([]);
  });

  it("removeObjects keeps selection for non-removed ids", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.addObject(makeRect({ id: "r2" })));
    act((s) => s.setSelectedObjects(["r1", "r2"]));
    act((s) => s.removeObjects(["r1"]));
    expect(state().selectedObjectIds).toEqual(["r2"]);
  });

  it("setSelectedObjects stores ids", () => {
    act((s) => s.setSelectedObjects(["a", "b"]));
    expect(state().selectedObjectIds).toEqual(["a", "b"]);
  });

  it("bringToFront moves object to end of its layer", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.addObject(makeRect({ id: "r3", layerId })));
    act((s) => s.bringToFront("r1"));
    const ids = state().objects.map((o) => o.id);
    expect(ids[ids.length - 1]).toBe("r1");
  });

  it("bringForward swaps with next object", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.bringForward("r1"));
    expect(state().objects[0].id).toBe("r2");
    expect(state().objects[1].id).toBe("r1");
  });

  it("bringForward does nothing for last object", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.bringForward("r2"));
    expect(state().objects[1].id).toBe("r2");
  });

  it("sendBackward swaps with previous object", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.sendBackward("r2"));
    expect(state().objects[0].id).toBe("r2");
    expect(state().objects[1].id).toBe("r1");
  });

  it("sendBackward does nothing for first object", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.sendBackward("r1"));
    expect(state().objects[0].id).toBe("r1");
  });

  it("sendToBack moves object to start of its layer", () => {
    const layerId = state().activeLayerId;
    act((s) => s.addObject(makeRect({ id: "r1", layerId })));
    act((s) => s.addObject(makeRect({ id: "r2", layerId })));
    act((s) => s.addObject(makeRect({ id: "r3", layerId })));
    act((s) => s.sendToBack("r3"));
    expect(state().objects[0].id).toBe("r3");
  });

  it("bringToFront with non-existent id is a no-op", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    const before = state().objects.map((o) => o.id);
    act((s) => s.bringToFront("nonexistent"));
    expect(state().objects.map((o) => o.id)).toEqual(before);
  });
});

// ===========================================================================
// Color System
// ===========================================================================

describe("Color System", () => {
  it("defaults to black foreground", () => {
    expect(state().foregroundColor).toBe("#000000");
  });

  it("defaults to white background", () => {
    expect(state().backgroundColor).toBe("#ffffff");
  });

  it("setForegroundColor updates color", () => {
    act((s) => s.setForegroundColor("#ff0000"));
    expect(state().foregroundColor).toBe("#ff0000");
  });

  it("setForegroundColor adds to recentColors", () => {
    act((s) => s.setForegroundColor("#ff0000"));
    expect(state().recentColors).toContain("#ff0000");
  });

  it("recentColors has no duplicates", () => {
    act((s) => s.setForegroundColor("#ff0000"));
    act((s) => s.setForegroundColor("#00ff00"));
    act((s) => s.setForegroundColor("#ff0000"));
    const count = state().recentColors.filter((c) => c === "#ff0000").length;
    expect(count).toBe(1);
  });

  it("recentColors max 12 entries", () => {
    for (let i = 0; i < 15; i++) {
      act((s) => s.setForegroundColor(`#${i.toString(16).padStart(6, "0")}`));
    }
    expect(state().recentColors.length).toBeLessThanOrEqual(12);
  });

  it("recentColors puts newest first", () => {
    act((s) => s.setForegroundColor("#aaa"));
    act((s) => s.setForegroundColor("#bbb"));
    expect(state().recentColors[0]).toBe("#bbb");
  });

  it("setBackgroundColor updates color", () => {
    act((s) => s.setBackgroundColor("#123456"));
    expect(state().backgroundColor).toBe("#123456");
  });

  it("swapColors exchanges foreground and background", () => {
    act((s) => s.setForegroundColor("#ff0000"));
    act((s) => s.setBackgroundColor("#00ff00"));
    act((s) => s.swapColors());
    expect(state().foregroundColor).toBe("#00ff00");
    expect(state().backgroundColor).toBe("#ff0000");
  });

  it("resetColors restores defaults", () => {
    act((s) => s.setForegroundColor("#ff0000"));
    act((s) => s.setBackgroundColor("#00ff00"));
    act((s) => s.resetColors());
    expect(state().foregroundColor).toBe("#000000");
    expect(state().backgroundColor).toBe("#ffffff");
  });
});

// ===========================================================================
// Brush Settings
// ===========================================================================

describe("Brush Settings", () => {
  it("default brushSize is 10", () => {
    expect(state().brushSize).toBe(10);
  });

  it("default brushOpacity is 1", () => {
    expect(state().brushOpacity).toBe(1);
  });

  it("default brushHardness is 1", () => {
    expect(state().brushHardness).toBe(1);
  });

  it("setBrushSize updates value", () => {
    act((s) => s.setBrushSize(50));
    expect(state().brushSize).toBe(50);
  });

  it("setBrushSize clamps to min 1", () => {
    act((s) => s.setBrushSize(0));
    expect(state().brushSize).toBe(1);
  });

  it("setBrushSize clamps to max 500", () => {
    act((s) => s.setBrushSize(1000));
    expect(state().brushSize).toBe(500);
  });

  it("setBrushSize clamps negative to 1", () => {
    act((s) => s.setBrushSize(-10));
    expect(state().brushSize).toBe(1);
  });

  it("setBrushOpacity updates value", () => {
    act((s) => s.setBrushOpacity(0.5));
    expect(state().brushOpacity).toBe(0.5);
  });

  it("setBrushOpacity clamps to min 0", () => {
    act((s) => s.setBrushOpacity(-0.5));
    expect(state().brushOpacity).toBe(0);
  });

  it("setBrushOpacity clamps to max 1", () => {
    act((s) => s.setBrushOpacity(2));
    expect(state().brushOpacity).toBe(1);
  });

  it("setBrushHardness clamps to 0..1", () => {
    act((s) => s.setBrushHardness(-1));
    expect(state().brushHardness).toBe(0);
    act((s) => s.setBrushHardness(5));
    expect(state().brushHardness).toBe(1);
  });
});

// ===========================================================================
// Adjustments
// ===========================================================================

describe("Adjustments", () => {
  it("defaults all to 0", () => {
    const adj = state().adjustments;
    expect(adj.brightness).toBe(0);
    expect(adj.contrast).toBe(0);
    expect(adj.hue).toBe(0);
    expect(adj.saturation).toBe(0);
    expect(adj.luminance).toBe(0);
    expect(adj.exposure).toBe(0);
    expect(adj.vibrance).toBe(0);
    expect(adj.warmth).toBe(0);
  });

  it("setAdjustment updates a specific value", () => {
    act((s) => s.setAdjustment("brightness", 50));
    expect(state().adjustments.brightness).toBe(50);
  });

  it("setAdjustment does not affect other values", () => {
    act((s) => s.setAdjustment("brightness", 50));
    expect(state().adjustments.contrast).toBe(0);
  });

  it("setAdjustment clamps brightness to -100..100", () => {
    act((s) => s.setAdjustment("brightness", 200));
    expect(state().adjustments.brightness).toBe(100);
    act((s) => s.setAdjustment("brightness", -200));
    expect(state().adjustments.brightness).toBe(-100);
  });

  it("setAdjustment clamps hue to 0..359", () => {
    act((s) => s.setAdjustment("hue", 400));
    expect(state().adjustments.hue).toBe(359);
    act((s) => s.setAdjustment("hue", -10));
    expect(state().adjustments.hue).toBe(0);
  });

  it("setAdjustment clamps contrast to -100..100", () => {
    act((s) => s.setAdjustment("contrast", 150));
    expect(state().adjustments.contrast).toBe(100);
  });

  it("resetAdjustments restores all to 0", () => {
    act((s) => s.setAdjustment("brightness", 50));
    act((s) => s.setAdjustment("contrast", -30));
    act((s) => s.resetAdjustments());
    const adj = state().adjustments;
    expect(adj.brightness).toBe(0);
    expect(adj.contrast).toBe(0);
  });
});

// ===========================================================================
// Filters
// ===========================================================================

describe("Filters", () => {
  it("all filters disabled initially", () => {
    for (const f of state().filters) {
      expect(f.enabled).toBe(false);
    }
  });

  it("toggleFilter enables a filter", () => {
    act((s) => s.toggleFilter("blur"));
    const blur = state().filters.find((f) => f.type === "blur");
    expect(blur?.enabled).toBe(true);
  });

  it("toggleFilter disables an enabled filter", () => {
    act((s) => s.toggleFilter("blur"));
    act((s) => s.toggleFilter("blur"));
    const blur = state().filters.find((f) => f.type === "blur");
    expect(blur?.enabled).toBe(false);
  });

  it("setFilterParam updates a filter parameter", () => {
    act((s) => s.setFilterParam("blur", "radius", 5));
    const blur = state().filters.find((f) => f.type === "blur");
    expect(blur?.params.radius).toBe(5);
  });

  it("setFilterParam does not affect other filters", () => {
    act((s) => s.setFilterParam("blur", "radius", 5));
    const sharpen = state().filters.find((f) => f.type === "sharpen");
    expect(sharpen?.params.amount).toBe(0);
  });
});

// ===========================================================================
// Selection
// ===========================================================================

describe("Selection", () => {
  it("selection starts as null", () => {
    expect(state().selection).toBeNull();
  });

  it("setSelection stores state", () => {
    const sel: SelectionState = {
      type: "rect",
      points: [0, 0, 100, 100],
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    };
    act((s) => s.setSelection(sel));
    expect(state().selection).toEqual(sel);
  });

  it("setSelection null clears selection", () => {
    const sel: SelectionState = {
      type: "rect",
      points: [0, 0, 100, 100],
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    };
    act((s) => s.setSelection(sel));
    act((s) => s.setSelection(null));
    expect(state().selection).toBeNull();
  });

  it("invertSelection flips mask bytes", () => {
    const mask = new Uint8Array([0, 128, 255]);
    const sel: SelectionState = {
      type: "rect",
      points: [0, 0, 100, 100],
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      mask,
    };
    act((s) => s.setSelection(sel));
    act((s) => s.invertSelection());
    const inverted = state().selection?.mask;
    expect(inverted?.[0]).toBe(255);
    expect(inverted?.[1]).toBe(127);
    expect(inverted?.[2]).toBe(0);
  });

  it("invertSelection does nothing with no selection", () => {
    act((s) => s.invertSelection());
    expect(state().selection).toBeNull();
  });

  it("invertSelection does nothing without a mask", () => {
    const sel: SelectionState = {
      type: "rect",
      points: [0, 0, 100, 100],
      bounds: { x: 0, y: 0, width: 100, height: 100 },
    };
    act((s) => s.setSelection(sel));
    act((s) => s.invertSelection());
    expect(state().selection?.mask).toBeUndefined();
  });
});

// ===========================================================================
// Crop
// ===========================================================================

describe("Crop", () => {
  it("cropState starts as null", () => {
    expect(state().cropState).toBeNull();
  });

  it("setCropState stores state and sets isCropping", () => {
    const crop: CropState = {
      x: 10,
      y: 20,
      width: 200,
      height: 150,
      aspectRatio: null,
    };
    act((s) => s.setCropState(crop));
    expect(state().cropState).toEqual(crop);
    expect(state().isCropping).toBe(true);
  });

  it("setCropState null clears crop and isCropping", () => {
    act((s) => s.setCropState({ x: 0, y: 0, width: 100, height: 100, aspectRatio: null }));
    act((s) => s.setCropState(null));
    expect(state().cropState).toBeNull();
    expect(state().isCropping).toBe(false);
  });

  it("applyCrop updates canvasSize to crop dimensions", () => {
    act((s) => s.setCropState({ x: 10, y: 20, width: 300, height: 200, aspectRatio: null }));
    act((s) => s.applyCrop());
    expect(state().canvasSize).toEqual({ width: 300, height: 200 });
  });

  it("applyCrop offsets objects by crop origin", () => {
    act((s) => s.addObject(makeRect({ id: "r1", x: 50, y: 60 })));
    act((s) => s.setCropState({ x: 10, y: 20, width: 300, height: 200, aspectRatio: null }));
    act((s) => s.applyCrop());
    const obj = state().objects[0];
    expect(obj.type === "rect" && obj.attrs.x).toBe(40); // 50 - 10
    expect(obj.type === "rect" && obj.attrs.y).toBe(40); // 60 - 20
  });

  it("applyCrop clears cropState and isCropping", () => {
    act((s) => s.setCropState({ x: 0, y: 0, width: 100, height: 100, aspectRatio: null }));
    act((s) => s.applyCrop());
    expect(state().cropState).toBeNull();
    expect(state().isCropping).toBe(false);
  });

  it("applyCrop marks dirty", () => {
    act((s) => s.setCropState({ x: 0, y: 0, width: 100, height: 100, aspectRatio: null }));
    act((s) => s.applyCrop());
    expect(state().isDirty).toBe(true);
  });

  it("applyCrop is a no-op without cropState", () => {
    const canvasBefore = state().canvasSize;
    act((s) => s.applyCrop());
    expect(state().canvasSize).toEqual(canvasBefore);
  });
});

// ===========================================================================
// Clipboard
// ===========================================================================

describe("Clipboard", () => {
  it("clipboard starts as null", () => {
    expect(state().clipboard).toBeNull();
  });

  it("copyObjects stores selected objects", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.addObject(makeRect({ id: "r2" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    expect(state().clipboard).toHaveLength(1);
    expect(state().clipboard?.[0].id).toBe("r1");
  });

  it("copyObjects does not modify original objects", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    expect(state().objects).toHaveLength(1);
  });

  it("cutObjects stores and removes selected objects", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.addObject(makeRect({ id: "r2" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.cutObjects());
    expect(state().clipboard).toHaveLength(1);
    expect(state().objects).toHaveLength(1);
    expect(state().objects[0].id).toBe("r2");
  });

  it("pasteObjects adds with new IDs", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    act((s) => s.pasteObjects());
    expect(state().objects).toHaveLength(2);
    expect(state().objects[1].id).not.toBe("r1");
  });

  it("pasteObjects offsets by 10px", () => {
    act((s) => s.addObject(makeRect({ id: "r1", x: 10, y: 20 })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    act((s) => s.pasteObjects());
    const pasted = state().objects[1];
    expect(pasted.type === "rect" && pasted.attrs.x).toBe(20); // 10 + 10
    expect(pasted.type === "rect" && pasted.attrs.y).toBe(30); // 20 + 10
  });

  it("pasteObjects selects pasted objects", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    act((s) => s.pasteObjects());
    expect(state().selectedObjectIds).toHaveLength(1);
    expect(state().selectedObjectIds[0]).not.toBe("r1");
  });

  it("pasteObjects is a no-op when clipboard is null", () => {
    act((s) => s.pasteObjects());
    expect(state().objects).toHaveLength(0);
  });

  it("pasteObjects is a no-op when clipboard is empty", () => {
    useEditorStore.setState({ clipboard: [] });
    act((s) => s.pasteObjects());
    expect(state().objects).toHaveLength(0);
  });

  it("pasteInPlace adds at exact position", () => {
    act((s) => s.addObject(makeRect({ id: "r1", x: 10, y: 20 })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    act((s) => s.pasteInPlace());
    const pasted = state().objects[1];
    expect(pasted.type === "rect" && pasted.attrs.x).toBe(10);
    expect(pasted.type === "rect" && pasted.attrs.y).toBe(20);
  });

  it("pasteInPlace assigns new IDs", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    act((s) => s.setSelectedObjects(["r1"]));
    act((s) => s.copyObjects());
    act((s) => s.pasteInPlace());
    expect(state().objects[1].id).not.toBe("r1");
  });

  it("pasteInPlace is a no-op when clipboard is null", () => {
    act((s) => s.pasteInPlace());
    expect(state().objects).toHaveLength(0);
  });
});

// ===========================================================================
// Guides
// ===========================================================================

describe("Guides", () => {
  it("guides starts empty", () => {
    expect(state().guides).toEqual([]);
  });

  it("addGuide creates a guide", () => {
    act((s) => s.addGuide("horizontal", 100));
    expect(state().guides).toHaveLength(1);
    expect(state().guides[0].orientation).toBe("horizontal");
    expect(state().guides[0].position).toBe(100);
  });

  it("addGuide assigns unique ids", () => {
    act((s) => s.addGuide("horizontal", 100));
    act((s) => s.addGuide("vertical", 200));
    expect(state().guides[0].id).not.toBe(state().guides[1].id);
  });

  it("removeGuide deletes by id", () => {
    act((s) => s.addGuide("horizontal", 100));
    const id = state().guides[0].id;
    act((s) => s.removeGuide(id));
    expect(state().guides).toEqual([]);
  });

  it("updateGuide changes position", () => {
    act((s) => s.addGuide("horizontal", 100));
    const id = state().guides[0].id;
    act((s) => s.updateGuide(id, 250));
    expect(state().guides[0].position).toBe(250);
  });

  it("toggleSnapping flips snappingEnabled", () => {
    expect(state().snappingEnabled).toBe(true);
    act((s) => s.toggleSnapping());
    expect(state().snappingEnabled).toBe(false);
    act((s) => s.toggleSnapping());
    expect(state().snappingEnabled).toBe(true);
  });

  it("toggleRulers flips rulersVisible", () => {
    expect(state().rulersVisible).toBe(false);
    act((s) => s.toggleRulers());
    expect(state().rulersVisible).toBe(true);
  });

  it("toggleGuides flips guidesVisible", () => {
    expect(state().guidesVisible).toBe(true);
    act((s) => s.toggleGuides());
    expect(state().guidesVisible).toBe(false);
  });

  it("toggleGrid flips gridVisible", () => {
    expect(state().gridVisible).toBe(false);
    act((s) => s.toggleGrid());
    expect(state().gridVisible).toBe(true);
  });
});

// ===========================================================================
// Document State
// ===========================================================================

describe("Document State", () => {
  it("isDirty starts false", () => {
    expect(state().isDirty).toBe(false);
  });

  it("markDirty sets isDirty to true", () => {
    act((s) => s.markDirty());
    expect(state().isDirty).toBe(true);
  });

  it("markClean sets isDirty to false", () => {
    act((s) => s.markDirty());
    act((s) => s.markClean());
    expect(state().isDirty).toBe(false);
  });

  it("addObject sets isDirty", () => {
    act((s) => s.addObject(makeRect()));
    expect(state().isDirty).toBe(true);
  });

  it("removeObjects sets isDirty", () => {
    act((s) => s.addObject(makeRect({ id: "r1" })));
    useEditorStore.setState({ isDirty: false });
    act((s) => s.removeObjects(["r1"]));
    expect(state().isDirty).toBe(true);
  });

  it("addLayer sets isDirty", () => {
    act((s) => s.addLayer());
    expect(state().isDirty).toBe(true);
  });

  it("updateLayer sets isDirty", () => {
    const id = state().layers[0].id;
    act((s) => s.updateLayer(id, { name: "Renamed" }));
    expect(state().isDirty).toBe(true);
  });

  it("reorderLayers sets isDirty", () => {
    act((s) => s.addLayer());
    useEditorStore.setState({ isDirty: false });
    act((s) => s.reorderLayers(0, 1));
    expect(state().isDirty).toBe(true);
  });

  it("applyCrop sets isDirty", () => {
    act((s) => s.setCropState({ x: 0, y: 0, width: 100, height: 100, aspectRatio: null }));
    act((s) => s.applyCrop());
    expect(state().isDirty).toBe(true);
  });

  it("resizeCanvas sets isDirty", () => {
    act((s) => s.resizeCanvas(500, 400, "center"));
    expect(state().isDirty).toBe(true);
  });

  it("setLoadingState stores loading state", () => {
    act((s) => s.setLoadingState({ operation: "export", progress: 50, cancellable: true }));
    expect(state().loadingState).toEqual({
      operation: "export",
      progress: 50,
      cancellable: true,
    });
  });

  it("setLoadingState null clears it", () => {
    act((s) => s.setLoadingState({ operation: "export", progress: 50, cancellable: true }));
    act((s) => s.setLoadingState(null));
    expect(state().loadingState).toBeNull();
  });
});

// ===========================================================================
// Canvas Transforms
// ===========================================================================

describe("Canvas Transforms", () => {
  it("rotateCanvas 90 swaps dimensions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.rotateCanvas(90));
    expect(state().canvasSize).toEqual({ width: 600, height: 800 });
  });

  it("rotateCanvas 180 keeps dimensions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.rotateCanvas(180));
    expect(state().canvasSize).toEqual({ width: 800, height: 600 });
  });

  it("rotateCanvas 270 swaps dimensions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.rotateCanvas(270));
    expect(state().canvasSize).toEqual({ width: 600, height: 800 });
  });

  it("rotateCanvas 90 transforms object positions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.addObject(makeRect({ id: "r1", x: 100, y: 200 })));
    act((s) => s.rotateCanvas(90));
    const obj = state().objects[0];
    // After 90 rotation: newX = canvasHeight - y = 600 - 200, newY = x = 100
    expect(obj.type === "rect" && obj.attrs.x).toBe(400);
    expect(obj.type === "rect" && obj.attrs.y).toBe(100);
  });

  it("flipCanvasHorizontal flips object x positions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.addObject(makeRect({ id: "r1", x: 100, y: 200 })));
    act((s) => s.flipCanvasHorizontal());
    const obj = state().objects[0];
    expect(obj.type === "rect" && obj.attrs.x).toBe(700); // 800 - 100
    expect(obj.type === "rect" && obj.attrs.y).toBe(200); // unchanged
  });

  it("flipCanvasVertical flips object y positions", () => {
    act((s) => s.loadImage("blob:test", 800, 600));
    act((s) => s.addObject(makeRect({ id: "r1", x: 100, y: 200 })));
    act((s) => s.flipCanvasVertical());
    const obj = state().objects[0];
    expect(obj.type === "rect" && obj.attrs.x).toBe(100); // unchanged
    expect(obj.type === "rect" && obj.attrs.y).toBe(400); // 600 - 200
  });

  it("trimCanvas marks dirty", () => {
    act((s) => s.trimCanvas());
    expect(state().isDirty).toBe(true);
  });
});

// ===========================================================================
// Right Panel
// ===========================================================================

describe("Right Panel", () => {
  it("default tab is layers", () => {
    expect(state().rightPanelTab).toBe("layers");
  });

  it("setRightPanelTab changes tab", () => {
    act((s) => s.setRightPanelTab("adjustments"));
    expect(state().rightPanelTab).toBe("adjustments");
  });

  it("toggleRightPanel flips visibility", () => {
    expect(state().rightPanelVisible).toBe(true);
    act((s) => s.toggleRightPanel());
    expect(state().rightPanelVisible).toBe(false);
    act((s) => s.toggleRightPanel());
    expect(state().rightPanelVisible).toBe(true);
  });
});

// ===========================================================================
// Cursor Position
// ===========================================================================

describe("Cursor Position", () => {
  it("setCursorPosition updates position", () => {
    act((s) => s.setCursorPosition({ x: 150, y: 250 }));
    expect(state().cursorPosition).toEqual({ x: 150, y: 250 });
  });
});
