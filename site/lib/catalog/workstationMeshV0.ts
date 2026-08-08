/**
 * Minimal mesh plan generator for systems-v0 (footprint + primitive boxes).
 */

import {
  workstationFootprintMm,
  type WorkstationConfigV0,
  type WorkstationFootprintMm,
} from "@/lib/catalog/workstationSystemV0";

export type WorkstationV0MeshPart = {
  id: string;
  kind: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

export type WorkstationV0MeshPlan = {
  footprint: WorkstationFootprintMm;
  parts: readonly WorkstationV0MeshPart[];
};

export function generateWorkstationV0MeshPlan(
  config: WorkstationConfigV0,
): WorkstationV0MeshPlan {
  const footprint = workstationFootprintMm(config);
  const parts: WorkstationV0MeshPart[] = [
    {
      id: "desk-top",
      kind: "desk",
      widthMm: config.size.lengthMm,
      depthMm: config.size.depthMm,
      heightMm: 25,
    },
  ];
  for (const module of config.modules) {
    if (module === "desk") continue;
    parts.push({
      id: module,
      kind: module,
      widthMm: Math.min(600, config.size.lengthMm),
      depthMm: Math.min(400, config.size.depthMm),
      heightMm: module === "panel" ? 400 : config.heightMm,
    });
  }
  return { footprint, parts };
}
