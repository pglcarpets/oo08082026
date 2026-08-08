"use client";
import { createContext, useContext } from "react";
import type { StudioBridge } from "@studio/lib/studioTypes";

export const StudioContext = createContext<StudioBridge | null>(null);

export const useStudio = (): StudioBridge => {
  const v = useContext(StudioContext);
  if (!v) throw new Error("useStudio must be used within <StudioContext.Provider>");
  return v;
};
