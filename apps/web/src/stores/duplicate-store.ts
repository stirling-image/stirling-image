import { create } from "zustand";

export interface DuplicateFileInfo {
  filename: string;
  similarity: number;
  width: number;
  height: number;
  fileSize: number;
  format: string;
  isBest: boolean;
  thumbnail: string | null;
}

export interface DuplicateGroup {
  groupId: number;
  files: DuplicateFileInfo[];
}

export interface DuplicateResult {
  totalImages: number;
  uniqueImages: number;
  spaceSaveable: number;
  duplicateGroups: DuplicateGroup[];
}

interface DuplicateState {
  results: DuplicateResult | null;
  scanning: boolean;
  viewMode: "overview" | "detail";
  selectedGroupIndex: number;
  bestOverrides: Record<number, number>;

  setResults: (r: DuplicateResult | null) => void;
  setScanning: (v: boolean) => void;
  setViewMode: (m: "overview" | "detail") => void;
  setSelectedGroup: (i: number) => void;
  overrideBest: (groupIndex: number, fileIndex: number) => void;
  reset: () => void;
}

export const useDuplicateStore = create<DuplicateState>((set) => ({
  results: null,
  scanning: false,
  viewMode: "overview",
  selectedGroupIndex: 0,
  bestOverrides: {},

  setResults: (results) =>
    set({ results, viewMode: "overview", selectedGroupIndex: 0, bestOverrides: {} }),
  setScanning: (scanning) => set({ scanning }),
  setViewMode: (viewMode) => set({ viewMode }),
  setSelectedGroup: (selectedGroupIndex) => set({ selectedGroupIndex, viewMode: "detail" }),
  overrideBest: (groupIndex, fileIndex) =>
    set((s) => ({ bestOverrides: { ...s.bestOverrides, [groupIndex]: fileIndex } })),
  reset: () =>
    set({
      results: null,
      scanning: false,
      viewMode: "overview",
      selectedGroupIndex: 0,
      bestOverrides: {},
    }),
}));
