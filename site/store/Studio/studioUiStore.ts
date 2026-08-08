"use client";
import { create } from "zustand";

/** Furniture Studio UI state. The Planner has its own independent store. */

export type StudioUnit = "mm" | "cm" | "m" | "in";
type ToastKind = "ok" | "error" | string;

type ToastState = {
  id: number;
  message: string;
  kind: ToastKind;
} | null;

type StudioUIStore = {
  unit: StudioUnit;
  setUnit: (unit: StudioUnit) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
  gridSize: number;
  setGridSize: (gridSize: number) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  toast: ToastState;
  showToast: (message: string, kind?: ToastKind) => void;
};

export const useStudioUIStore = create<StudioUIStore>((set) => ({
  unit: "mm",
  setUnit: (unit) => set({ unit }),

  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  gridSize: 100,
  setGridSize: (gridSize) => set({ gridSize }),

  showGrid: true,
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),

  toast: null,
  showToast: (message, kind = "ok") => {
    const id = Date.now();
    set({ toast: { id, message, kind } });
    setTimeout(
      () => set((s) => (s.toast?.id === id ? { toast: null } : s)),
      2600,
    );
  },
}));
