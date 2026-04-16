import { create } from "zustand";
import { apiGet } from "@/lib/api";

interface SettingsState {
  disabledTools: string[];
  experimentalEnabled: boolean;
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  disabledTools: [],
  experimentalEnabled: false,
  loaded: false,

  fetch: async () => {
    if (get().loaded) return;
    try {
      const data = await apiGet<{
        settings: Record<string, string>;
      }>("/v1/settings");

      set({
        disabledTools: data.settings.disabledTools ? JSON.parse(data.settings.disabledTools) : [],
        experimentalEnabled: data.settings.enableExperimentalTools === "true",
        loaded: true,
      });
    } catch {
      // Settings fetch failed - default to no disabled tools
      set({ loaded: true });
    }
  },
}));
