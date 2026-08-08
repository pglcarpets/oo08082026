"use client";
import { create } from "zustand";
import { listFurniture } from "@studio/lib/studioApi";
import type { FurnitureItem } from "@studio/lib/studioTypes";

type CatalogStore = {
  items: FurnitureItem[];
  loading: boolean;
  error: string | null;
  categories: string[];
  refresh: () => Promise<void>;
  addItem: (item: FurnitureItem) => void;
};

export const useCatalogStore = create<CatalogStore>((set) => ({
  items: [],
  loading: false,
  error: null,
  categories: ["all"],
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const items = (await listFurniture()) as FurnitureItem[];
      const cats = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));
      set({ items, categories: ["all", ...cats.sort()], loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Failed to load catalog",
        loading: false,
      });
    }
  },
  addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
}));
