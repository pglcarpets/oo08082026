"use client";
import { createContext, useContext } from "react";
import type { PlannerBridge } from "@planner/lib/plannerTypes";

export const PlannerContext = createContext<PlannerBridge | null>(null);

export const usePlanner = (): PlannerBridge => {
  const v = useContext(PlannerContext);
  if (!v) throw new Error("usePlanner must be used within <PlannerContext.Provider>");
  return v;
};
