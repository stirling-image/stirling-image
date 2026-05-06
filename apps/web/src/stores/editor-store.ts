import { create } from "zustand";
import { generateId } from "@/lib/utils";
import type {
  AdjustmentValues,
  AnchorPosition,
  CropState,
  EditorLayer,
  EditorState,
  GuideOrientation,
  SelectionMode,
  SelectionState,
  ToolType,
} from "@/types/editor";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDefaultLayer(name = "Layer 1"): EditorLayer {
  return {
    id: generateId(),
    name,
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: "source-over",
    thumbnail: null,
  };
}

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

function nextLayerName(layers: EditorLayer[]): string {
  const max = layers.reduce((n, l) => {
    const m = l.name.match(/^Layer (\d+)/);
    return m ? Math.max(n, Number(m[1])) : n;
  }, 0);
  return `Layer ${max + 1}`;
}

// ---------------------------------------------------------------------------
// Anchor offset calculation for canvas resize
// ---------------------------------------------------------------------------

function anchorOffset(
  anchor: AnchorPosition,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): { dx: number; dy: number } {
  const dw = newW - oldW;
  const dh = newH - oldH;
  let dx = 0;
  let dy = 0;

  if (anchor.includes("center") && !anchor.includes("left") && !anchor.includes("right")) {
    dx = dw / 2;
  } else if (anchor.includes("right")) {
    dx = dw;
  }

  if (anchor === "center" || anchor === "center-left" || anchor === "center-right") {
    dy = dh / 2;
  } else if (anchor.startsWith("bottom")) {
    dy = dh;
  }

  return { dx, dy };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

const defaultLayer = createDefaultLayer();

export const useEditorStore = create<EditorState>()((set, get) => ({
  // Canvas
  canvasSize: { width: 1920, height: 1080 },
  zoom: 1,
  panOffset: { x: 0, y: 0 },

  // Image
  sourceImageUrl: null,
  sourceImageSize: null,

  // Active tool
  activeTool: "move",
  previousTool: null,

  // Brush/Eraser
  brushSize: 12,
  brushOpacity: 1,
  brushHardness: 1,

  // Colors
  foregroundColor: "#000000",
  backgroundColor: "#ffffff",
  recentColors: [],

  // Layers
  layers: [defaultLayer],
  activeLayerId: defaultLayer.id,

  // Objects
  objects: [],
  selectedObjectIds: [],
  clipboard: [],

  // Selection
  selection: null,
  selectionMode: "new" as SelectionMode,

  // Crop
  cropState: null,
  isCropping: false,

  // Adjustments & Filters
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  filters: [],

  // Text
  editingTextId: null,

  // Shape settings
  shapeFill: "#3b82f6",
  shapeStroke: "#000000",
  shapeStrokeWidth: 2,
  shapeCornerRadius: 0,
  shapePolygonSides: 6,
  shapeStarPoints: 5,

  // Guides
  guides: [],
  showRulers: true,
  showGuides: true,
  snapToGuides: true,

  // UI
  rightPanelTab: "layers",
  rightPanelVisible: true,

  // Document
  isDirty: false,

  // History
  lastAction: "",

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  setTool: (tool: ToolType) => set((s) => ({ activeTool: tool, previousTool: s.activeTool })),

  setZoom: (zoom: number) => set({ zoom: Math.max(0.01, Math.min(64, zoom)) }),

  setPanOffset: (offset) => set({ panOffset: offset }),

  loadImage: (url, width, height) =>
    set({
      sourceImageUrl: url,
      sourceImageSize: { width, height },
      canvasSize: { width, height },
      zoom: 1,
      panOffset: { x: 0, y: 0 },
      isDirty: false,
    }),

  // -- Colors --

  setForegroundColor: (color) =>
    set((s) => {
      const recent = [color, ...s.recentColors.filter((c) => c !== color)].slice(0, 12);
      return { foregroundColor: color, recentColors: recent };
    }),

  setBackgroundColor: (color) => set({ backgroundColor: color }),

  swapColors: () =>
    set((s) => ({
      foregroundColor: s.backgroundColor,
      backgroundColor: s.foregroundColor,
    })),

  resetColors: () => set({ foregroundColor: "#000000", backgroundColor: "#ffffff" }),

  // -- Objects --

  addObject: (obj) =>
    set((s) => ({
      objects: [...s.objects, { ...obj, layerId: s.activeLayerId }],
      isDirty: true,
      lastAction: "Add Object",
    })),

  updateObject: (id, attrs) =>
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, attrs: { ...o.attrs, ...attrs } } : o)),
      isDirty: true,
    })),

  removeObjects: (ids) =>
    set((s) => ({
      objects: s.objects.filter((o) => !ids.includes(o.id)),
      selectedObjectIds: s.selectedObjectIds.filter((i) => !ids.includes(i)),
      isDirty: true,
      lastAction: "Delete Object",
    })),

  setSelectedObjects: (ids) => set({ selectedObjectIds: ids }),

  duplicateObjects: (ids) => {
    const s = get();
    const dupes = s.objects
      .filter((o) => ids.includes(o.id))
      .map((o) => ({
        ...o,
        id: generateId(),
        attrs: {
          ...o.attrs,
          x: ((o.attrs.x as number) ?? 0) + 10,
          y: ((o.attrs.y as number) ?? 0) + 10,
        },
      }));
    set({
      objects: [...s.objects, ...dupes],
      selectedObjectIds: dupes.map((d) => d.id),
      isDirty: true,
      lastAction: "Duplicate",
    });
  },

  // -- Z-ordering --

  bringToFront: (id) =>
    set((s) => {
      const obj = s.objects.find((o) => o.id === id);
      if (!obj) return s;
      const layerObjs = s.objects.filter((o) => o.layerId === obj.layerId && o.id !== id);
      const others = s.objects.filter((o) => o.layerId !== obj.layerId);
      return {
        objects: [...others, ...layerObjs, obj],
        isDirty: true,
        lastAction: "Bring to Front",
      };
    }),

  bringForward: (id) =>
    set((s) => {
      const idx = s.objects.findIndex((o) => o.id === id);
      if (idx === -1) return s;
      const obj = s.objects[idx];
      // Find the next object in the same layer
      let nextIdx = -1;
      for (let i = idx + 1; i < s.objects.length; i++) {
        if (s.objects[i].layerId === obj.layerId) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx === -1) return s;
      const copy = [...s.objects];
      copy.splice(idx, 1);
      copy.splice(nextIdx, 0, obj);
      return { objects: copy, isDirty: true, lastAction: "Bring Forward" };
    }),

  sendBackward: (id) =>
    set((s) => {
      const idx = s.objects.findIndex((o) => o.id === id);
      if (idx === -1) return s;
      const obj = s.objects[idx];
      let prevIdx = -1;
      for (let i = idx - 1; i >= 0; i--) {
        if (s.objects[i].layerId === obj.layerId) {
          prevIdx = i;
          break;
        }
      }
      if (prevIdx === -1) return s;
      const copy = [...s.objects];
      copy.splice(idx, 1);
      copy.splice(prevIdx, 0, obj);
      return { objects: copy, isDirty: true, lastAction: "Send Backward" };
    }),

  sendToBack: (id) =>
    set((s) => {
      const obj = s.objects.find((o) => o.id === id);
      if (!obj) return s;
      const layerObjs = s.objects.filter((o) => o.layerId === obj.layerId && o.id !== id);
      const others = s.objects.filter((o) => o.layerId !== obj.layerId);
      return {
        objects: [...others, obj, ...layerObjs],
        isDirty: true,
        lastAction: "Send to Back",
      };
    }),

  // -- Clipboard --

  copyObjects: (ids) => {
    const s = get();
    const copied = s.objects.filter((o) => ids.includes(o.id));
    set({ clipboard: copied });
  },

  cutObjects: (ids) => {
    const s = get();
    const copied = s.objects.filter((o) => ids.includes(o.id));
    set({
      clipboard: copied,
      objects: s.objects.filter((o) => !ids.includes(o.id)),
      selectedObjectIds: [],
      isDirty: true,
      lastAction: "Cut",
    });
  },

  pasteObjects: () => {
    const s = get();
    if (s.clipboard.length === 0) return;
    const pasted = s.clipboard.map((o) => ({
      ...o,
      id: generateId(),
      layerId: s.activeLayerId,
      attrs: {
        ...o.attrs,
        x: ((o.attrs.x as number) ?? 0) + 10,
        y: ((o.attrs.y as number) ?? 0) + 10,
      },
    }));
    set({
      objects: [...s.objects, ...pasted],
      selectedObjectIds: pasted.map((p) => p.id),
      isDirty: true,
      lastAction: "Paste",
    });
  },

  // -- Layers --

  addLayer: () => {
    const s = get();
    const layer = createDefaultLayer(nextLayerName(s.layers));
    const idx = s.layers.findIndex((l) => l.id === s.activeLayerId);
    const copy = [...s.layers];
    copy.splice(idx + 1, 0, layer);
    set({
      layers: copy,
      activeLayerId: layer.id,
      isDirty: true,
      lastAction: "Add Layer",
    });
  },

  removeLayer: (id) =>
    set((s) => {
      if (s.layers.length <= 1) return s;
      const idx = s.layers.findIndex((l) => l.id === id);
      const remaining = s.layers.filter((l) => l.id !== id);
      const newActive =
        s.activeLayerId === id
          ? remaining[Math.min(idx, remaining.length - 1)].id
          : s.activeLayerId;
      return {
        layers: remaining,
        objects: s.objects.filter((o) => o.layerId !== id),
        activeLayerId: newActive,
        isDirty: true,
        lastAction: "Delete Layer",
      };
    }),

  duplicateLayer: (id) => {
    const s = get();
    const src = s.layers.find((l) => l.id === id);
    if (!src) return;
    const newId = generateId();
    const dup: EditorLayer = {
      ...src,
      id: newId,
      name: `${src.name} (copy)`,
      thumbnail: null,
    };
    const dupeObjs = s.objects
      .filter((o) => o.layerId === id)
      .map((o) => ({ ...o, id: generateId(), layerId: newId }));
    const idx = s.layers.findIndex((l) => l.id === id);
    const copy = [...s.layers];
    copy.splice(idx + 1, 0, dup);
    set({
      layers: copy,
      objects: [...s.objects, ...dupeObjs],
      activeLayerId: newId,
      isDirty: true,
      lastAction: "Duplicate Layer",
    });
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  updateLayer: (id, updates) =>
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      isDirty: true,
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((s) => {
      const copy = [...s.layers];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return { layers: copy, isDirty: true, lastAction: "Reorder Layers" };
    }),

  mergeDown: (id) =>
    set((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx <= 0) return s;
      const below = s.layers[idx - 1];
      const merged = s.objects.map((o) => (o.layerId === id ? { ...o, layerId: below.id } : o));
      return {
        layers: s.layers.filter((l) => l.id !== id),
        objects: merged,
        activeLayerId: below.id,
        isDirty: true,
        lastAction: "Merge Down",
      };
    }),

  flattenAll: () =>
    set((s) => {
      const first = s.layers[0];
      if (!first) return s;
      return {
        layers: [{ ...first, name: "Layer 1" }],
        objects: s.objects.map((o) => ({ ...o, layerId: first.id })),
        activeLayerId: first.id,
        isDirty: true,
        lastAction: "Flatten All",
      };
    }),

  // -- Adjustments & Filters --

  setAdjustment: (key, value) =>
    set((s) => ({
      adjustments: { ...s.adjustments, [key]: value },
      isDirty: true,
    })),

  resetAdjustments: () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),

  toggleFilter: (type) =>
    set((s) => {
      const existing = s.filters.find((f) => f.type === type);
      if (existing) {
        return {
          filters: s.filters.map((f) => (f.type === type ? { ...f, enabled: !f.enabled } : f)),
          isDirty: true,
        };
      }
      return {
        filters: [...s.filters, { type, enabled: true, params: {} }],
        isDirty: true,
      };
    }),

  setFilterParam: (type, key, value) =>
    set((s) => ({
      filters: s.filters.map((f) =>
        f.type === type ? { ...f, params: { ...f.params, [key]: value } } : f,
      ),
      isDirty: true,
    })),

  // -- Selection --

  setSelection: (selection: SelectionState | null) => set({ selection }),

  setSelectionMode: (mode: SelectionMode) => set({ selectionMode: mode }),

  invertSelection: () =>
    set((s) => {
      if (!s.selection) return s;
      // Invert: swap to full canvas bounds minus current selection
      return {
        selection: {
          ...s.selection,
          bounds: {
            x: 0,
            y: 0,
            width: s.canvasSize.width,
            height: s.canvasSize.height,
          },
        },
        isDirty: true,
      };
    }),

  // -- Crop --

  setCropState: (state: CropState | null) => set({ cropState: state, isCropping: state !== null }),

  applyCrop: () =>
    set((s) => {
      if (!s.cropState) return s;
      const { x, y, width, height } = s.cropState;
      return {
        canvasSize: { width, height },
        objects: s.objects.map((o) => ({
          ...o,
          attrs: {
            ...o.attrs,
            x: ((o.attrs.x as number) ?? 0) - x,
            y: ((o.attrs.y as number) ?? 0) - y,
          },
        })),
        cropState: null,
        isCropping: false,
        isDirty: true,
        lastAction: "Crop",
      };
    }),

  // -- Brush --

  setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(500, size)) }),
  setBrushOpacity: (opacity) => set({ brushOpacity: Math.max(0, Math.min(1, opacity)) }),
  setBrushHardness: (hardness) => set({ brushHardness: Math.max(0, Math.min(1, hardness)) }),

  // -- Guides --

  addGuide: (orientation: GuideOrientation, position: number) =>
    set((s) => ({
      guides: [...s.guides, { id: generateId(), orientation, position }],
    })),

  removeGuide: (id) => set((s) => ({ guides: s.guides.filter((g) => g.id !== id) })),

  updateGuide: (id, position) =>
    set((s) => ({
      guides: s.guides.map((g) => (g.id === id ? { ...g, position } : g)),
    })),

  toggleRulers: () => set((s) => ({ showRulers: !s.showRulers })),
  toggleGuides: () => set((s) => ({ showGuides: !s.showGuides })),
  toggleSnapping: () => set((s) => ({ snapToGuides: !s.snapToGuides })),

  // -- Document operations --

  resizeCanvas: (width, height, anchor, _fill) =>
    set((s) => {
      const { dx, dy } = anchorOffset(
        anchor,
        s.canvasSize.width,
        s.canvasSize.height,
        width,
        height,
      );
      return {
        canvasSize: { width, height },
        objects: s.objects.map((o) => ({
          ...o,
          attrs: {
            ...o.attrs,
            x: ((o.attrs.x as number) ?? 0) + dx,
            y: ((o.attrs.y as number) ?? 0) + dy,
          },
        })),
        isDirty: true,
        lastAction: "Resize Canvas",
      };
    }),

  resizeImage: (width, height) =>
    set((s) => {
      const sx = width / s.canvasSize.width;
      const sy = height / s.canvasSize.height;
      return {
        canvasSize: { width, height },
        objects: s.objects.map((o) => ({
          ...o,
          attrs: {
            ...o.attrs,
            x: ((o.attrs.x as number) ?? 0) * sx,
            y: ((o.attrs.y as number) ?? 0) * sy,
            width: o.attrs.width ? (o.attrs.width as number) * sx : undefined,
            height: o.attrs.height ? (o.attrs.height as number) * sy : undefined,
          },
        })),
        isDirty: true,
        lastAction: "Resize Image",
      };
    }),

  rotateCanvas: (degrees) =>
    set((s) => {
      const { width: w, height: h } = s.canvasSize;
      const swap = degrees === 90 || degrees === 270;
      const nw = swap ? h : w;
      const nh = swap ? w : h;
      return {
        canvasSize: { width: nw, height: nh },
        objects: s.objects.map((o) => {
          const ox = (o.attrs.x as number) ?? 0;
          const oy = (o.attrs.y as number) ?? 0;
          let nx: number;
          let ny: number;
          if (degrees === 90) {
            nx = h - oy;
            ny = ox;
          } else if (degrees === 180) {
            nx = w - ox;
            ny = h - oy;
          } else {
            nx = oy;
            ny = w - ox;
          }
          return { ...o, attrs: { ...o.attrs, x: nx, y: ny } };
        }),
        isDirty: true,
        lastAction: "Rotate Canvas",
      };
    }),

  flipCanvasHorizontal: () =>
    set((s) => ({
      objects: s.objects.map((o) => ({
        ...o,
        attrs: {
          ...o.attrs,
          x: s.canvasSize.width - ((o.attrs.x as number) ?? 0),
          scaleX: -((o.attrs.scaleX as number) ?? 1),
        },
      })),
      isDirty: true,
      lastAction: "Flip Horizontal",
    })),

  flipCanvasVertical: () =>
    set((s) => ({
      objects: s.objects.map((o) => ({
        ...o,
        attrs: {
          ...o.attrs,
          y: s.canvasSize.height - ((o.attrs.y as number) ?? 0),
          scaleY: -((o.attrs.scaleY as number) ?? 1),
        },
      })),
      isDirty: true,
      lastAction: "Flip Vertical",
    })),

  trimCanvas: () =>
    set((s) => {
      if (s.objects.length === 0) return s;
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (const o of s.objects) {
        const x = (o.attrs.x as number) ?? 0;
        const y = (o.attrs.y as number) ?? 0;
        const w = (o.attrs.width as number) ?? 0;
        const h = (o.attrs.height as number) ?? 0;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + w);
        maxY = Math.max(maxY, y + h);
      }
      const tw = Math.max(1, maxX - minX);
      const th = Math.max(1, maxY - minY);
      return {
        canvasSize: { width: tw, height: th },
        objects: s.objects.map((o) => ({
          ...o,
          attrs: {
            ...o.attrs,
            x: ((o.attrs.x as number) ?? 0) - minX,
            y: ((o.attrs.y as number) ?? 0) - minY,
          },
        })),
        isDirty: true,
        lastAction: "Trim Canvas",
      };
    }),

  // -- UI --

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
  toggleRightPanel: () => set((s) => ({ rightPanelVisible: !s.rightPanelVisible })),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));
