"use client";
import { create } from "zustand";

/** Floor Planner UI state. The Studio has its own independent store. */

export type PlannerUnit = "mm" | "cm" | "m" | "in";
type ToastKind = "ok" | "error" | string;

type ToastState = {
  id: number;
  message: string;
  kind: ToastKind;
} | null;

type PlannerUIStore = {
  unit: PlannerUnit;
  setUnit: (unit: PlannerUnit) => void;
  snapEnabled: boolean;
  toggleSnap: () => void;
  gridSize: number;
  setGridSize: (gridSize: number) => void;
  showGrid: boolean;
  toggleGrid: () => void;
  toast: ToastState;
  showToast: (message: string, kind?: ToastKind) => void;
};

export const usePlannerUIStore = create<PlannerUIStore>((set) => ({
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
