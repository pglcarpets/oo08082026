"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface QuoteCartItem {
  id: string;
  name: string;
  qty: number;
  image?: string;
  href?: string;
}

interface QuoteCartState {
  items: QuoteCartItem[];
  totalQty: number;
  addItem: (item: Omit<QuoteCartItem, "qty"> & { qty?: number }) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
}

type QuoteCartPersisted = Pick<QuoteCartState, "items">;

function totalQty(items: QuoteCartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

export const useQuoteCart = create<QuoteCartState>()(
  persist(
    (set) => ({
      items: [],
      totalQty: 0,
      addItem: (incoming) =>
        set((state) => {
          const qtyToAdd = Math.max(1, incoming.qty ?? 1);
          const existing = state.items.find((item) => item.id === incoming.id);

          const nextItems = existing
            ? state.items.map((item) =>
                item.id === incoming.id
                  ? { ...item, qty: item.qty + qtyToAdd }
                  : item,
              )
            : [
                ...state.items,
                {
                  id: incoming.id,
                  name: incoming.name,
                  qty: qtyToAdd,
                  image: incoming.image,
                  href: incoming.href,
                },
              ];

          return { items: nextItems, totalQty: totalQty(nextItems) };
        }),
      removeItem: (id) =>
        set((state) => {
          const nextItems = state.items.filter((item) => item.id !== id);
          return { items: nextItems, totalQty: totalQty(nextItems) };
        }),
      setQty: (id, qty) =>
        set((state) => {
          const normalizedQty = Math.max(0, Math.floor(qty));
          const nextItems = state.items
            .map((item) =>
              item.id === id ? { ...item, qty: normalizedQty } : item,
            )
            .filter((item) => item.qty > 0);
          return { items: nextItems, totalQty: totalQty(nextItems) };
        }),
      clearCart: () => ({ items: [], totalQty: 0 }),
    }),
    {
      name: "quote-cart-v1",
      storage: createJSONStorage(() => localStorage),
      // Defer rehydrate to useEffect so React 19 does not warn about
      // state updates on components that have not finished mounting.
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as QuoteCartPersisted | undefined;
        const items = persisted?.items ?? currentState.items;
        return {
          ...currentState,
          items,
          totalQty: totalQty(items),
        };
      },
    },
  ),
);
