export type BoqFurnitureInput = {
  id: string;
  catalogId: string;
  sku?: string;
  name: string;
  widthMm?: number;
  depthMm?: number;
};

export type BoqLine = {
  catalogId: string;
  sku?: string;
  name: string;
  quantity: number;
  widthMm?: number;
  depthMm?: number;
  unitPriceInr: number;
  lineTotalInr: number;
  priced: boolean;
};

export type PlannerFurnitureBoq = {
  kind: "oo-furniture-boq-v1";
  projectId: string;
  projectName: string;
  lines: BoqLine[];
  subtotalInr: number;
  gstRate: number;
  gstInr: number;
  totalInr: number;
  calculationHash: string;
  pricingNote: string;
};

export const PLANNER_FURNITURE_BOQ_GST_RATE = 0.18;
