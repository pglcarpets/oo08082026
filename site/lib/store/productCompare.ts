"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface ProductCompareItem {
  id: string;
  productUrlKey: string;
  categoryId: string;
  name: string;
  image?: string;
  href?: string;
}

interface ProductCompareState {
  items: ProductCompareItem[];
  addItem: (item: ProductCompareItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: ProductCompareItem) => void;
  clear: () => void;
}

const MAX_COMPARE_ITEMS = 4;

export const useProductCompare = create<ProductCompareState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (incoming) =>
        set((state) => {
          const exists = state.items.some((item) => item.id === incoming.id);
          if (exists) {return state;}
          const nextItems = [...state.items, incoming].slice(-MAX_COMPARE_ITEMS);
          return { items: nextItems };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      toggleItem: (incoming) => {
        const exists = get().items.some((item) => item.id === incoming.id);
        if (exists) {
          get().removeItem(incoming.id);
          return;
        }
        get().addItem(incoming);
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "product-compare-v1",
      storage: createJSONStorage(() => localStorage),
      // Defer rehydrate to useEffect — same React 19 mount-safety as quoteCart.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export { MAX_COMPARE_ITEMS };
