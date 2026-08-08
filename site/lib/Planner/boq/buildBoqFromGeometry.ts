import { sha256Hex } from "@/lib/catalog/svg/sha256";
import {
  PLANNER_FURNITURE_BOQ_PRICING_DISABLED_NOTE,
  PLANNER_FURNITURE_BOQ_PRICING_NOTE,
} from "@planner/lib/projectFurnitureBoq";
import {
  PLANNER_FURNITURE_BOQ_GST_RATE,
  type BoqFurnitureInput,
  type BoqLine,
  type PlannerFurnitureBoq,
} from "./types";

export type BuildBoqInput = {
  projectId: string;
  projectName: string;
  furniture: readonly BoqFurnitureInput[];
  /** Return major-currency unit price (INR) or null when unpriced. */
  priceForSku?: (sku: string) => number | null;
  pricingEnabled?: boolean;
  gstRate?: number;
};

/**
 * Aggregate placed furniture into an honest BOQ.
 * Unpriced SKUs keep unitPriceInr = 0 (never invent money).
 */
export function buildBoqFromGeometry(input: BuildBoqInput): PlannerFurnitureBoq {
  const pricingEnabled = Boolean(input.pricingEnabled);
  const priceForSku = input.priceForSku ?? (() => null);
  const gstRate = input.gstRate ?? PLANNER_FURNITURE_BOQ_GST_RATE;

  const groups = new Map<string, BoqLine>();

  for (const item of input.furniture) {
    const catalogId = item.catalogId?.trim() || "unknown";
    const sku = item.sku?.trim() || undefined;
    const key = sku ? `sku:${sku}` : `cat:${catalogId}|${item.name}`;
    const existing = groups.get(key);
    if (existing) {
      existing.quantity += 1;
      continue;
    }
    let unitPriceInr = 0;
    let priced = false;
    if (pricingEnabled && sku) {
      const p = priceForSku(sku);
      if (typeof p === "number" && Number.isFinite(p) && p > 0) {
        unitPriceInr = Math.round(p);
        priced = true;
      }
    }
    groups.set(key, {
      catalogId,
      sku,
      name: item.name || catalogId,
      quantity: 1,
      widthMm: item.widthMm,
      depthMm: item.depthMm,
      unitPriceInr,
      lineTotalInr: 0,
      priced,
    });
  }

  const lines = [...groups.values()]
    .map((line) => ({
      ...line,
      lineTotalInr: line.unitPriceInr * line.quantity,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const subtotalInr = lines.reduce((s, l) => s + l.lineTotalInr, 0);
  const gstInr = Math.round(subtotalInr * gstRate);
  const totalInr = subtotalInr + gstInr;

  const hashPayload = JSON.stringify({
    projectId: input.projectId,
    lines: lines.map((l) => ({
      catalogId: l.catalogId,
      sku: l.sku ?? null,
      quantity: l.quantity,
      unitPriceInr: l.unitPriceInr,
    })),
  });

  return {
    kind: "oo-furniture-boq-v1",
    projectId: input.projectId,
    projectName: input.projectName,
    lines,
    subtotalInr,
    gstRate,
    gstInr,
    totalInr,
    calculationHash: sha256Hex(hashPayload),
    pricingNote: pricingEnabled
      ? PLANNER_FURNITURE_BOQ_PRICING_NOTE
      : PLANNER_FURNITURE_BOQ_PRICING_DISABLED_NOTE,
  };
}
