// apps/web/src/stores/editor-store.ts

import { temporal } from "zundo";
import { create } from "zustand";
import { generateId } from "@/lib/utils";
import type {
  AdjustmentValues,
  CanvasObject,
  EditorLayer,
  EditorState,
  FilterConfig,
  ToolType,
} from "@/types/editor";

const DEFAULT_CANVAS_SIZE = { width: 1920, height: 1080 };
const DEFAULT_LAYER_ID = "layer-1";
const MAX_RECENT_COLORS = 12;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 64;
const MAX_BRUSH_SIZE = 500;
const MAX_HISTORY = 50;

const DEFAULT_ADJUSTMENTS: AdjustmentValues = {
  brightness: 0,
  contrast: 0,
  hue: 0,
  saturation: 0,
  luminance: 0,
  exposure: 0,
  vibrance: 0,
  warmth: 0,
};

const DEFAULT_FILTERS: FilterConfig[] = [
  { type: "blur", enabled: false, params: { radius: 0 } },
  { type: "sharpen", enabled: false, params: { amount: 0 } },
  { type: "noise", enabled: false, params: { amount: 0 } },
  { type: "pixelate", enabled: false, params: { size: 1 } },
  { type: "emboss", enabled: false, params: { strength: 0 } },
  { type: "grayscale", enabled: false, params: {} },
  { type: "sepia", enabled: false, params: {} },
  { type: "invert", enabled: false, params: {} },
  { type: "posterize", enabled: false, params: { levels: 8 } },
  { type: "solarize", enabled: false, params: {} },
  { type: "threshold", enabled: false, params: { level: 0.5 } },
  { type: "kaleidoscope", enabled: false, params: { power: 2, angle: 0 } },
  { type: "motionBlur", enabled: false, params: { angle: 0, distance: 10 } },
  {
    type: "radialBlur",
    enabled: false,
    params: { amount: 10, centerX: 0.5, centerY: 0.5 },
  },
  {
    type: "surfaceBlur",
    enabled: false,
    params: { radius: 5, threshold: 25 },
  },
  {
    type: "vignette",
    enabled: false,
    params: { amount: 50, midpoint: 50, roundness: 0, feather: 50 },
  },
  {
    type: "grain",
    enabled: false,
    params: { amount: 25, size: 25, roughness: 50 },
  },
];

function createDefaultLayer(id: string, name: string): EditorLayer {
  return {
    id,
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "source-over",
    thumbnail: null,
  };
}

let layerCounter = 1;

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      // --- Canvas ---
      canvasSize: DEFAULT_CANVAS_SIZE,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      cursorPosition: { x: 0, y: 0 },

      // --- Image ---
      sourceImageUrl: null,
      sourceImageSize: null,

      // --- Tool ---
      activeTool: "move" as ToolType,
      previousTool: null,

      // --- Brush ---
      brushSize: 10,
      brushOpacity: 1,
      brushHardness: 1,

      // --- Colors ---
      foregroundColor: "#000000",
      backgroundColor: "#ffffff",
      recentColors: [],

      // --- Layers ---
      layers: [createDefaultLayer(DEFAULT_LAYER_ID, "Layer 1")],
      activeLayerId: DEFAULT_LAYER_ID,

      // --- Objects ---
      objects: [],
      selectedObjectIds: [],

      // --- Selection ---
      selection: null,

      // --- Crop ---
      cropState: null,
      isCropping: false,

      // --- Adjustments ---
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      filters: DEFAULT_FILTERS.map((f) => ({
        ...f,
        params: { ...f.params },
      })),

      // --- Text ---
      editingTextId: null,

      // --- Shape settings ---
      shapeFill: "#3b82f6",
      shapeStroke: "#000000",
      shapeStrokeWidth: 2,
      shapeCornerRadius: 0,
      shapePolygonSides: 6,
      shapeStarPoints: 5,

      // --- Clone stamp ---
      cloneSource: null,

      // --- Dodge/Burn/Sponge ---
      dodgeBurnRange: "midtones",
      dodgeBurnExposure: 50,
      spongeMode: "saturate",
      spongeFlow: 50,

      // --- UI ---
      rightPanelTab: "layers",
      rightPanelVisible: true,
      isSpaceHeld: false,

      // --- Document ---
      isDirty: false,
      lastAutoSave: null,

      // --- Clipboard ---
      clipboard: null,

      // --- Guides ---
      guides: [],
      snappingEnabled: true,
      rulersVisible: false,
      guidesVisible: true,
      gridVisible: false,

      // --- Loading ---
      loadingState: null,

      // --- History ---
      lastAction: "Initial State",
      _historyVersion: 0,

      // ===== ACTIONS =====

      setTool: (tool) => {
        const { activeTool } = get();
        set({
          activeTool: tool,
          previousTool: activeTool,
          isCropping: tool === "crop",
        });
      },

      setCursorPosition: (pos) => set({ cursorPosition: pos }),

      setZoom: (zoom) => set({ zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)) }),

      setPanOffset: (offset) => set({ panOffset: offset }),

      loadImage: (url, width, height) => {
        set({
          sourceImageUrl: url,
          sourceImageSize: { width, height },
          canvasSize: { width, height },
          zoom: 1,
          panOffset: { x: 0, y: 0 },
          lastAction: "Load Image",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      resizeCanvas: (width, height, _anchor) => {
        set({
          canvasSize: { width, height },
          isDirty: true,
          lastAction: "Resize Canvas",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      resizeImage: (width, height) => {
        set({
          canvasSize: { width, height },
          sourceImageSize: { width, height },
          isDirty: true,
          lastAction: "Resize Image",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      rotateCanvas: (degrees) => {
        const { canvasSize, objects } = get();
        const newSize =
          degrees === 180 ? canvasSize : { width: canvasSize.height, height: canvasSize.width };
        set({
          canvasSize: newSize,
          sourceImageSize: newSize,
          objects: objects.map((obj) => {
            const attrs = { ...obj.attrs };
            if ("x" in attrs && "y" in attrs) {
              if (degrees === 90) {
                const newX = canvasSize.height - (attrs as { y: number }).y;
                const newY = (attrs as { x: number }).x;
                (attrs as { x: number }).x = newX;
                (attrs as { y: number }).y = newY;
              } else if (degrees === 270) {
                const newX = (attrs as { y: number }).y;
                const newY = canvasSize.width - (attrs as { x: number }).x;
                (attrs as { x: number }).x = newX;
                (attrs as { y: number }).y = newY;
              } else {
                (attrs as { x: number }).x = canvasSize.width - (attrs as { x: number }).x;
                (attrs as { y: number }).y = canvasSize.height - (attrs as { y: number }).y;
              }
            }
            return { ...obj, attrs } as CanvasObject;
          }),
          isDirty: true,
          lastAction: `Rotate Canvas ${degrees}`,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      flipCanvasHorizontal: () => {
        const { canvasSize, objects } = get();
        set({
          objects: objects.map((obj) => {
            const attrs = { ...obj.attrs };
            if ("x" in attrs) {
              (attrs as { x: number }).x = canvasSize.width - (attrs as { x: number }).x;
            }
            return { ...obj, attrs } as CanvasObject;
          }),
          isDirty: true,
          lastAction: "Flip Horizontal",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      flipCanvasVertical: () => {
        const { canvasSize, objects } = get();
        set({
          objects: objects.map((obj) => {
            const attrs = { ...obj.attrs };
            if ("y" in attrs) {
              (attrs as { y: number }).y = canvasSize.height - (attrs as { y: number }).y;
            }
            return { ...obj, attrs } as CanvasObject;
          }),
          isDirty: true,
          lastAction: "Flip Vertical",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      trimCanvas: () => {
        set({
          isDirty: true,
          lastAction: "Trim Canvas",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Colors
      setForegroundColor: (color) => {
        const { recentColors } = get();
        const updated = [color, ...recentColors.filter((c) => c !== color)].slice(
          0,
          MAX_RECENT_COLORS,
        );
        set({ foregroundColor: color, recentColors: updated });
      },

      setBackgroundColor: (color) => set({ backgroundColor: color }),

      swapColors: () => {
        const { foregroundColor, backgroundColor } = get();
        set({
          foregroundColor: backgroundColor,
          backgroundColor: foregroundColor,
        });
      },

      resetColors: () => set({ foregroundColor: "#000000", backgroundColor: "#ffffff" }),

      // Objects
      addObject: (obj) => {
        set({
          objects: [...get().objects, { ...obj, layerId: obj.layerId || get().activeLayerId }],
          isDirty: true,
          lastAction: `Add ${obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}`,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Issue #11: Don't increment _historyVersion here -- updateObject is called
      // on every mousemove during brush strokes for live preview. History is only
      // recorded when addObject finalizes the stroke.
      updateObject: (id, attrs) => {
        set({
          objects: get().objects.map((obj) =>
            obj.id === id ? ({ ...obj, attrs: { ...obj.attrs, ...attrs } } as CanvasObject) : obj,
          ),
          isDirty: true,
        });
      },

      removeObjects: (ids) => {
        const idSet = new Set(ids);
        set({
          objects: get().objects.filter((obj) => !idSet.has(obj.id)),
          selectedObjectIds: get().selectedObjectIds.filter((id) => !idSet.has(id)),
          isDirty: true,
          lastAction: "Delete",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      setSelectedObjects: (ids) => set({ selectedObjectIds: ids }),

      bringToFront: (objectId) => {
        const { objects } = get();
        const obj = objects.find((o) => o.id === objectId);
        if (!obj) return;
        const layerObjects = objects.filter((o) => o.layerId === obj.layerId);
        const otherObjects = objects.filter((o) => o.layerId !== obj.layerId);
        const reordered = [...layerObjects.filter((o) => o.id !== objectId), obj];
        set({
          objects: [...otherObjects, ...reordered],
          lastAction: "Bring to Front",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      bringForward: (objectId) => {
        const { objects } = get();
        const idx = objects.findIndex((o) => o.id === objectId);
        if (idx === -1 || idx === objects.length - 1) return;
        const newObjects = [...objects];
        [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
        set({
          objects: newObjects,
          lastAction: "Bring Forward",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      sendBackward: (objectId) => {
        const { objects } = get();
        const idx = objects.findIndex((o) => o.id === objectId);
        if (idx <= 0) return;
        const newObjects = [...objects];
        [newObjects[idx - 1], newObjects[idx]] = [newObjects[idx], newObjects[idx - 1]];
        set({
          objects: newObjects,
          lastAction: "Send Backward",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      sendToBack: (objectId) => {
        const { objects } = get();
        const obj = objects.find((o) => o.id === objectId);
        if (!obj) return;
        const layerObjects = objects.filter((o) => o.layerId === obj.layerId);
        const otherObjects = objects.filter((o) => o.layerId !== obj.layerId);
        const reordered = [obj, ...layerObjects.filter((o) => o.id !== objectId)];
        set({
          objects: [...reordered, ...otherObjects],
          lastAction: "Send to Back",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Layers
      addLayer: () => {
        layerCounter++;
        const id = generateId();
        const name = `Layer ${layerCounter}`;
        const newLayer = createDefaultLayer(id, name);
        const { layers, activeLayerId } = get();
        const activeIndex = layers.findIndex((l) => l.id === activeLayerId);
        const newLayers = [...layers];
        newLayers.splice(activeIndex + 1, 0, newLayer);
        set({
          layers: newLayers,
          activeLayerId: id,
          isDirty: true,
          lastAction: "Add Layer",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      removeLayer: (id) => {
        const { layers, objects, activeLayerId } = get();
        if (layers.length <= 1) return;
        const idx = layers.findIndex((l) => l.id === id);
        const newLayers = layers.filter((l) => l.id !== id);
        const newActiveId =
          activeLayerId === id ? newLayers[Math.min(idx, newLayers.length - 1)].id : activeLayerId;
        set({
          layers: newLayers,
          objects: objects.filter((o) => o.layerId !== id),
          activeLayerId: newActiveId,
          isDirty: true,
          lastAction: "Delete Layer",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      duplicateLayer: (id) => {
        const { layers, objects } = get();
        const source = layers.find((l) => l.id === id);
        if (!source) return;
        const newId = generateId();
        layerCounter++;
        const copy: EditorLayer = {
          ...source,
          id: newId,
          name: `${source.name} (copy)`,
          thumbnail: null,
        };
        const sourceObjects = objects
          .filter((o) => o.layerId === id)
          .map((o) => ({ ...o, id: generateId(), layerId: newId }) as CanvasObject);
        const idx = layers.findIndex((l) => l.id === id);
        const newLayers = [...layers];
        newLayers.splice(idx + 1, 0, copy);
        set({
          layers: newLayers,
          objects: [...objects, ...sourceObjects],
          activeLayerId: newId,
          isDirty: true,
          lastAction: "Duplicate Layer",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      setActiveLayer: (id) => set({ activeLayerId: id }),

      updateLayer: (id, updates) => {
        set({
          layers: get().layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
          isDirty: true,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      reorderLayers: (fromIndex, toIndex) => {
        const newLayers = [...get().layers];
        const [moved] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, moved);
        set({
          layers: newLayers,
          isDirty: true,
          lastAction: "Reorder Layers",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      mergeDown: (id) => {
        const { layers, objects } = get();
        const idx = layers.findIndex((l) => l.id === id);
        if (idx <= 0) return;
        const belowLayer = layers[idx - 1];
        const mergedObjects = objects.map((o) =>
          o.layerId === id ? ({ ...o, layerId: belowLayer.id } as CanvasObject) : o,
        );
        set({
          layers: layers.filter((l) => l.id !== id),
          objects: mergedObjects,
          activeLayerId: belowLayer.id,
          isDirty: true,
          lastAction: "Merge Down",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      flattenAll: () => {
        const { layers, objects } = get();
        const bottomLayer = layers[0];
        set({
          layers: [{ ...bottomLayer, name: "Flattened" }],
          objects: objects.map((o) => ({ ...o, layerId: bottomLayer.id }) as CanvasObject),
          activeLayerId: bottomLayer.id,
          isDirty: true,
          lastAction: "Flatten All",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Adjustments
      // Issue #7: Include _historyVersion increment for undo tracking
      setAdjustment: (key, value) => {
        const clamps: Record<string, [number, number]> = {
          brightness: [-100, 100],
          contrast: [-100, 100],
          hue: [0, 359],
          saturation: [-100, 100],
          luminance: [-100, 100],
          exposure: [-100, 100],
          vibrance: [-100, 100],
          warmth: [-100, 100],
        };
        const [min, max] = clamps[key] || [-100, 100];
        set({
          adjustments: {
            ...get().adjustments,
            [key]: Math.max(min, Math.min(max, value)),
          },
          isDirty: true,
          lastAction: `Adjust ${key.charAt(0).toUpperCase() + key.slice(1)}`,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      resetAdjustments: () =>
        set({
          adjustments: { ...DEFAULT_ADJUSTMENTS },
          isDirty: true,
          lastAction: "Reset Adjustments",
          _historyVersion: get()._historyVersion + 1,
        }),

      toggleFilter: (type) => {
        set({
          filters: get().filters.map((f) => (f.type === type ? { ...f, enabled: !f.enabled } : f)),
          isDirty: true,
          lastAction: `Toggle ${type.charAt(0).toUpperCase() + type.slice(1)} Filter`,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      setFilterParam: (type, key, value) => {
        set({
          filters: get().filters.map((f) =>
            f.type === type ? { ...f, params: { ...f.params, [key]: value } } : f,
          ),
          isDirty: true,
          lastAction: `Set ${type} ${key}`,
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Selection
      setSelection: (selection) => set({ selection }),

      invertSelection: () => {
        const { selection } = get();
        if (!selection) return;
        if (selection.mask) {
          const inverted = new Uint8Array(selection.mask.length);
          for (let i = 0; i < selection.mask.length; i++) {
            inverted[i] = 255 - selection.mask[i];
          }
          set({ selection: { ...selection, mask: inverted } });
        }
      },

      // Crop
      setCropState: (state) => set({ cropState: state, isCropping: state !== null }),

      applyCrop: () => {
        const { cropState, objects } = get();
        if (!cropState) return;
        set({
          canvasSize: { width: cropState.width, height: cropState.height },
          objects: objects.map((obj) => {
            const attrs = { ...obj.attrs };
            if ("x" in attrs) {
              (attrs as { x: number }).x -= cropState.x;
            }
            if ("y" in attrs) {
              (attrs as { y: number }).y -= cropState.y;
            }
            return { ...obj, attrs } as CanvasObject;
          }),
          cropState: null,
          isCropping: false,
          isDirty: true,
          lastAction: "Crop",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Brush
      setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(MAX_BRUSH_SIZE, size)) }),
      setBrushOpacity: (opacity) => set({ brushOpacity: Math.max(0, Math.min(1, opacity)) }),
      setBrushHardness: (hardness) => set({ brushHardness: Math.max(0, Math.min(1, hardness)) }),

      // Clipboard
      copyObjects: () => {
        const { objects, selectedObjectIds } = get();
        const selected = objects.filter((o) => selectedObjectIds.includes(o.id));
        set({ clipboard: selected });
      },

      cutObjects: () => {
        const { objects, selectedObjectIds } = get();
        const selected = objects.filter((o) => selectedObjectIds.includes(o.id));
        set({ clipboard: selected });
        get().removeObjects(selectedObjectIds);
      },

      pasteObjects: () => {
        const { clipboard, activeLayerId } = get();
        if (!clipboard || clipboard.length === 0) return;
        const pasted = clipboard.map(
          (obj) =>
            ({
              ...obj,
              id: generateId(),
              layerId: activeLayerId,
              attrs: {
                ...obj.attrs,
                ...("x" in obj.attrs ? { x: (obj.attrs as { x: number }).x + 10 } : {}),
                ...("y" in obj.attrs ? { y: (obj.attrs as { y: number }).y + 10 } : {}),
              },
            }) as CanvasObject,
        );
        set({
          objects: [...get().objects, ...pasted],
          selectedObjectIds: pasted.map((o) => o.id),
          isDirty: true,
          lastAction: "Paste",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      pasteInPlace: () => {
        const { clipboard, activeLayerId } = get();
        if (!clipboard || clipboard.length === 0) return;
        const pasted = clipboard.map(
          (obj) =>
            ({
              ...obj,
              id: generateId(),
              layerId: activeLayerId,
            }) as CanvasObject,
        );
        set({
          objects: [...get().objects, ...pasted],
          selectedObjectIds: pasted.map((o) => o.id),
          isDirty: true,
          lastAction: "Paste in Place",
          _historyVersion: get()._historyVersion + 1,
        });
      },

      // Guides
      addGuide: (orientation, position) => {
        set({
          guides: [...get().guides, { id: generateId(), orientation, position }],
        });
      },

      removeGuide: (id) => {
        set({ guides: get().guides.filter((g) => g.id !== id) });
      },

      updateGuide: (id, position) => {
        set({
          guides: get().guides.map((g) => (g.id === id ? { ...g, position } : g)),
        });
      },

      toggleSnapping: () => set({ snappingEnabled: !get().snappingEnabled }),
      toggleRulers: () => set({ rulersVisible: !get().rulersVisible }),
      toggleGuides: () => set({ guidesVisible: !get().guidesVisible }),
      toggleGrid: () => set({ gridVisible: !get().gridVisible }),

      // Document
      markDirty: () => set({ isDirty: true }),
      markClean: () => set({ isDirty: false }),
      setLoadingState: (state) => set({ loadingState: state }),

      // Right panel
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      toggleRightPanel: () => set({ rightPanelVisible: !get().rightPanelVisible }),
    }),
    {
      // Issue #8: Include lastAction in partialize so history labels work
      partialize: (state) => ({
        layers: state.layers,
        objects: state.objects,
        canvasSize: state.canvasSize,
        adjustments: state.adjustments,
        filters: state.filters,
        guides: state.guides,
        sourceImageUrl: state.sourceImageUrl,
        sourceImageSize: state.sourceImageSize,
        lastAction: state.lastAction,
        _historyVersion: state._historyVersion,
      }),
      limit: MAX_HISTORY,
      equality: (a, b) =>
        (a as { _historyVersion: number })._historyVersion ===
        (b as { _historyVersion: number })._historyVersion,
      // Issue #1: Forward all arguments from zundo's internal _handleSet.
      // No debounce -- the equality function (based on _historyVersion) already
      // prevents intermediate states from being recorded.  Debouncing caused
      // undo/redo to race with the delayed recording and silently discard the
      // future-states stack.
    },
  ),
);
