import type { SuggestedLayoutJson } from "./validateLayoutSchema";

export type CatalogDim = {
  widthMm: number;
  depthMm: number;
  name: string;
};

export type PlacementOp = {
  catalogId: string;
  name: string;
  xMm: number;
  yMm: number;
  rotationDeg: number;
  widthMm: number;
  depthMm: number;
};

/** Pure placement plan — skips unknown catalog ids. */
export function planPlacements(
  layout: SuggestedLayoutJson,
  catalog: Record<string, CatalogDim>,
): PlacementOp[] {
  const ops: PlacementOp[] = [];
  for (const item of layout.items) {
    const dim = catalog[item.catalogId];
    if (!dim) continue;
    ops.push({
      catalogId: item.catalogId,
      name: dim.name,
      xMm: item.xMm,
      yMm: item.yMm,
      rotationDeg: item.rotationDeg ?? 0,
      widthMm: dim.widthMm,
      depthMm: dim.depthMm,
    });
  }
  return ops;
}
