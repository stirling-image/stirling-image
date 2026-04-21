import { create } from "zustand";
import { apiGet } from "@/lib/api";

interface SettingsState {
  disabledTools: string[];
  experimentalEnabled: boolean;
  defaultToolView: "sidebar" | "fullscreen";
  loaded: boolean;
  fetch: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  disabledTools: [],
  experimentalEnabled: false,
  defaultToolView: "sidebar",
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
        defaultToolView: data.settings.defaultToolView === "fullscreen" ? "fullscreen" : "sidebar",
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },
}));
