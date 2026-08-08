export type AdvisorRecommendation = {
  productUrlKey?: string;
  productId: string;
  productName: string;
  category: string;
  why: string;
  budgetEstimate: string;
};

export type ConfiguratorAdvisorContext = {
  source: "global";
  mode?: "quick-estimate" | "technical-planner";
  sourcePath?: string;
  projectType?: "workstations" | "storages";
  seatOrUnitCount?: number;
  moduleCount?: number;
  modulesPerRow?: number;
  workstationSeries?: string;
  layoutLabel?: string;
  storageLayout?: string;
  roomWidthMm?: number;
  roomLengthMm?: number;
  roomClearanceMm?: number;
  fitStatus?: string;
  budgetBand?: string;
  siteLocation?: string;
  estimatedBudget?: string;
  keyOptions?: string[];
};

export type AdvisorRequest = {
  query: string;
  userId?: string;
  context?: ConfiguratorAdvisorContext;
  stream?: boolean;
};

export type AdvisorResult = {
  recommendations: AdvisorRecommendation[];
  totalBudget: string;
  summary: string;
  nextActions?: string[];
  warnings?: string[];
  pricingMode?: "band" | "on-request";
  fallbackUsed?: boolean;
};

export type AdvisorStreamEvent =
  | { type: "status"; message: string }
  | { type: "delta"; text: string }
  | { type: "result"; result: AdvisorResult }
  | { type: "error"; message: string };

export function hasUnsupportedCurrency(value: string): boolean {
  return /\$|usd\b|dollars?\b/i.test(value);
}

export function sanitizeAdvisorPriceText(
  value: string | undefined,
  fallback = "On request",
): string {
  const trimmed = value?.trim();
  if (!trimmed) {return fallback;}
  if (hasUnsupportedCurrency(trimmed)) {return fallback;}
  return trimmed;
}

export function buildConfiguratorContextSummary(
  context: ConfiguratorAdvisorContext | undefined,
): string {
  if (!context || context.source !== "global") {return "";}

  const lines = ["Advisor context:"];
  if (context.mode) {lines.push(`Mode: ${context.mode}`);}
  if (context.projectType) {lines.push(`Project type: ${context.projectType}`);}
  if (typeof context.seatOrUnitCount === "number") {
    lines.push(`Seats or units: ${context.seatOrUnitCount}`);
  }
  if (context.workstationSeries) {lines.push(`Series: ${context.workstationSeries}`);}
  if (context.layoutLabel) {lines.push(`Layout: ${context.layoutLabel}`);}
  if (context.storageLayout) {lines.push(`Storage layout: ${context.storageLayout}`);}
  if (typeof context.moduleCount === "number") {lines.push(`Module count: ${context.moduleCount}`);}
  if (typeof context.modulesPerRow === "number") {
    lines.push(`Modules per row: ${context.modulesPerRow}`);
  }
  if (typeof context.roomWidthMm === "number" && typeof context.roomLengthMm === "number") {
    lines.push(`Room size: ${context.roomWidthMm} x ${context.roomLengthMm} mm`);
  }
  if (typeof context.roomClearanceMm === "number") {
    lines.push(`Clearance: ${context.roomClearanceMm} mm`);
  }
  if (context.fitStatus) {lines.push(`Fit status: ${context.fitStatus}`);}
  if (context.budgetBand) {lines.push(`Budget band: ${context.budgetBand}`);}
  if (context.siteLocation) {lines.push(`Site location: ${context.siteLocation}`);}
  if (context.estimatedBudget) {lines.push(`Indicative budget: ${context.estimatedBudget}`);}
  if (context.keyOptions?.length) {lines.push(`Selected options: ${context.keyOptions.join(", ")}`);}

  return lines.join("\n");
}
