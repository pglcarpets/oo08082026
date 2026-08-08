/**
 * Demo INR unit price for systems-v0 workstations (partial commercial sample).
 */

import type { WorkstationConfigV0 } from "@/lib/catalog/workstationSystemV0";

const BASE_INR = 12_500;
const MODULE_INR: Record<string, number> = {
  desk: 0,
  panel: 2_800,
  pedestal: 4_200,
  overhead: 5_500,
};

export function workstationV0UnitPriceInr(config: WorkstationConfigV0): number {
  const areaFactor = (config.size.lengthMm * config.size.depthMm) / (1200 * 600);
  const modules = config.modules.reduce(
    (sum, m) => sum + (MODULE_INR[m] ?? 0),
    0,
  );
  const shapeFactor = config.shape === "l-shape" ? 1.65 : 1;
  return Math.round((BASE_INR * areaFactor * shapeFactor + modules) / 100) * 100;
}
