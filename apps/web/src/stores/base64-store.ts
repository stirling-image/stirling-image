import { create } from "zustand";

export interface Base64Result {
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  originalSize: number;
  encodedSize: number;
  overheadPercent: number;
  base64: string;
  dataUri: string;
}

export interface Base64Error {
  filename: string;
  error: string;
}

interface Base64State {
  results: Base64Result[];
  errors: Base64Error[];
  processing: boolean;
  expandedIndex: number;

  setResults: (results: Base64Result[], errors: Base64Error[]) => void;
  setProcessing: (v: boolean) => void;
  setExpandedIndex: (i: number) => void;
  reset: () => void;
}

export const useBase64Store = create<Base64State>((set) => ({
  results: [],
  errors: [],
  processing: false,
  expandedIndex: 0,

  setResults: (results, errors) => set({ results, errors, expandedIndex: 0 }),
  setProcessing: (v) => set({ processing: v }),
  setExpandedIndex: (i) => set({ expandedIndex: i }),
  reset: () => set({ results: [], errors: [], processing: false, expandedIndex: 0 }),
}));
