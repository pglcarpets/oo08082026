import type { PlannerFurnitureBoq } from "./types";

export function exportBoqCsv(boq: Pick<PlannerFurnitureBoq, "lines">): string {
  const header = ["Item", "CatalogId", "SKU", "Qty", "UnitPriceInr", "LineTotalInr", "Priced"].join(",");
  const rows = boq.lines.map((line) => {
    const name = `"${line.name.replace(/"/g, '""')}"`;
    return [
      name,
      line.catalogId,
      line.sku ?? "",
      String(line.quantity),
      String(line.unitPriceInr),
      String(line.lineTotalInr),
      line.priced ? "yes" : "no",
    ].join(",");
  });
  return [header, ...rows].join("\n");
}
