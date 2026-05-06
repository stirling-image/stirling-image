// ---------------------------------------------------------------------------
// Editor Types -- shared across all editor components and the Zustand store
// ---------------------------------------------------------------------------

export type ToolType =
  | "move"
  | "marquee-rect"
  | "marquee-ellipse"
  | "lasso-free"
  | "lasso-poly"
  | "magic-wand"
  | "crop"
  | "eyedropper"
  | "brush"
  | "eraser"
  | "pencil"
  | "fill"
  | "gradient"
  | "shape-rect"
  | "shape-ellipse"
  | "shape-line"
  | "shape-arrow"
  | "shape-polygon"
  | "shape-star"
  | "text"
  | "hand"
  | "zoom"
  | "transform";

export type CanvasObjectType =
  | "line"
  | "rect"
  | "ellipse"
  | "polygon"
  | "star"
  | "arrow"
  | "text"
  | "image"
  | "path";

export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  layerId: string;
  attrs: Record<string, unknown>;
}

export interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
  thumbnail: string | null;
}

export type SelectionType = "rect" | "ellipse" | "lasso";

export interface SelectionState {
  type: SelectionType;
  points: number[];
  bounds: { x: number; y: number; width: number; height: number };
}

export type SelectionMode = "new" | "add" | "subtract";

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: string | null;
}

export interface AdjustmentValues {
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
  luminance: number;
  exposure: number;
  vibrance: number;
  warmth: number;
}

export interface FilterConfig {
  type: string;
  enabled: boolean;
  params: Record<string, number>;
}

export type GuideOrientation = "horizontal" | "vertical";

export interface Guide {
  id: string;
  orientation: GuideOrientation;
  position: number;
}

export type AnchorPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "center-left"
  | "center"
  | "center-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type ResampleMethod = "nearest" | "bilinear" | "bicubic" | "lanczos";

export interface SmartGuide {
  orientation: GuideOrientation;
  position: number;
  type: "edge" | "center" | "canvas";
}

export interface EditorState {
  // Canvas
  canvasSize: { width: number; height: number };
  zoom: number;
  panOffset: { x: number; y: number };

  // Image
  sourceImageUrl: string | null;
  sourceImageSize: { width: number; height: number } | null;

  // Active tool
  activeTool: ToolType;
  previousTool: ToolType | null;

  // Brush/Eraser settings
  brushSize: number;
  brushOpacity: number;
  brushHardness: number;

  // Colors
  foregroundColor: string;
  backgroundColor: string;
  recentColors: string[];

  // Layers
  layers: EditorLayer[];
  activeLayerId: string;

  // Objects
  objects: CanvasObject[];
  selectedObjectIds: string[];
  clipboard: CanvasObject[];

  // Selection
  selection: SelectionState | null;
  selectionMode: SelectionMode;

  // Crop
  cropState: CropState | null;
  isCropping: boolean;

  // Adjustments & Filters
  adjustments: AdjustmentValues;
  filters: FilterConfig[];

  // Text
  editingTextId: string | null;

  // Shape settings
  shapeFill: string;
  shapeStroke: string;
  shapeStrokeWidth: number;
  shapeCornerRadius: number;
  shapePolygonSides: number;
  shapeStarPoints: number;

  // Guides
  guides: Guide[];
  showRulers: boolean;
  showGuides: boolean;
  snapToGuides: boolean;

  // UI
  rightPanelTab: "layers" | "adjustments" | "history";
  rightPanelVisible: boolean;

  // Document
  isDirty: boolean;

  // History tracking
  lastAction: string;

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------

  // Tool
  setTool: (tool: ToolType) => void;

  // Canvas
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  loadImage: (url: string, width: number, height: number) => void;

  // Colors
  setForegroundColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  swapColors: () => void;
  resetColors: () => void;

  // Objects
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, attrs: Partial<CanvasObject["attrs"]>) => void;
  removeObjects: (ids: string[]) => void;
  setSelectedObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;

  // Z-ordering
  bringToFront: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  sendToBack: (id: string) => void;

  // Clipboard
  copyObjects: (ids: string[]) => void;
  cutObjects: (ids: string[]) => void;
  pasteObjects: () => void;

  // Layers
  addLayer: () => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<EditorLayer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  mergeDown: (id: string) => void;
  flattenAll: () => void;

  // Adjustments & Filters
  setAdjustment: (key: keyof AdjustmentValues, value: number) => void;
  resetAdjustments: () => void;
  toggleFilter: (type: string) => void;
  setFilterParam: (type: string, key: string, value: number) => void;

  // Selection
  setSelection: (selection: SelectionState | null) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  invertSelection: () => void;

  // Crop
  setCropState: (state: CropState | null) => void;
  applyCrop: () => void;

  // Brush
  setBrushSize: (size: number) => void;
  setBrushOpacity: (opacity: number) => void;
  setBrushHardness: (hardness: number) => void;

  // Guides
  addGuide: (orientation: GuideOrientation, position: number) => void;
  removeGuide: (id: string) => void;
  updateGuide: (id: string, position: number) => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleSnapping: () => void;

  // Document operations
  resizeCanvas: (width: number, height: number, anchor: AnchorPosition, fill: string) => void;
  resizeImage: (width: number, height: number) => void;
  rotateCanvas: (degrees: 90 | 180 | 270) => void;
  flipCanvasHorizontal: () => void;
  flipCanvasVertical: () => void;
  trimCanvas: () => void;

  // UI
  setRightPanelTab: (tab: "layers" | "adjustments" | "history") => void;
  toggleRightPanel: () => void;
  markDirty: () => void;
  markClean: () => void;
}
