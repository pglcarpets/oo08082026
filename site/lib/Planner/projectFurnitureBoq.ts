/**
 * Residual BOQ pricing notes/types for admin commercial pricing authority.
 */

export type PlannerFurnitureBoqPricingMode =
  | "disabled"
  | "demo-list-partial"
  | "live-price-book-partial";

export const PLANNER_FURNITURE_BOQ_PRICING_DISABLED_NOTE =
  "Unit prices are off. BOQ shows quantity and footprint only.";

export const PLANNER_FURNITURE_BOQ_PRICING_NOTE =
  "Demo list unit prices (systems-v0 sample INR). Not a commercial price book.";
