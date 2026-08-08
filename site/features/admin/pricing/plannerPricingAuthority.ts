/**
 * Planner commercial pricing authority.
 *
 * Layers (lowest → highest):
 * 1. Off — default; BOQ shows quantity + footprint only.
 * 2. Demo list — planner `boqPricingEnabled` shows systems-v0 demo INR (partial).
 * 3. Live price book — admin-activated book pinned to workspace BOQ (not shipped).
 *
 * Live pricing is intentionally off until admin enables it via `/admin/price-books`.
 */

import type { PlannerFurnitureBoqPricingMode } from "@planner/lib/projectFurnitureBoq";
import {
  PLANNER_FURNITURE_BOQ_PRICING_DISABLED_NOTE,
  PLANNER_FURNITURE_BOQ_PRICING_NOTE,
} from "@planner/lib/projectFurnitureBoq";

export type PlannerCommercialPricingLayer = "off" | "demo-list" | "live-price-book";

export type PlannerCommercialPricingAuthority = {
  /** Which pricing layer is active for workspace BOQ. */
  layer: PlannerCommercialPricingLayer;
  /** Whether `buildPlannerFurnitureBoq` should attach unit prices. */
  pricingEnabled: boolean;
  /** Maps to `PlannerFurnitureBoqSummary.pricingMode`. */
  pricingMode: PlannerFurnitureBoqPricingMode;
  /** Human-readable honesty note for exports and review UI. */
  pricingNote: string;
  /** Short label for review panel / status chips. */
  pricingModeLabel: string;
};

/** Flip when admin live price-book pin ships to workspace BOQ. */
export const LIVE_PRICE_BOOK_SHIPPED = true as const;

/**
 * Live admin price-book pricing ships when an active version is pinned.
 * Without an active book, workspace BOQ stays demo-list or off.
 */
export function isLivePriceBookEnabled(activePriceBookId?: string | null): boolean {
  if (!LIVE_PRICE_BOOK_SHIPPED) {
    return false;
  }
  return Boolean(activePriceBookId?.trim());
}

export type ResolvePlannerCommercialPricingAuthorityInput = {
  /** Planner feature flag — demo list partial when true and live book is off. */
  boqPricingEnabled?: boolean;
  /** Future: active admin book id when live pin is wired. */
  activePriceBookId?: string | null;
};

export function resolvePlannerCommercialPricingAuthority(
  input: ResolvePlannerCommercialPricingAuthorityInput = {},
): PlannerCommercialPricingAuthority {
  const boqPricingEnabled = input.boqPricingEnabled ?? false;

  if (isLivePriceBookEnabled(input.activePriceBookId)) {
    return {
      layer: "live-price-book",
      pricingEnabled: true,
      pricingMode: "live-price-book-partial",
      pricingNote:
        "Unit prices come from the active admin price book. Confirm version and currency before commercial use.",
      pricingModeLabel: "Live price book",
    };
  }

  if (boqPricingEnabled) {
    return {
      layer: "demo-list",
      pricingEnabled: true,
      pricingMode: "demo-list-partial",
      pricingNote: PLANNER_FURNITURE_BOQ_PRICING_NOTE,
      pricingModeLabel: "Demo list",
    };
  }

  return {
    layer: "off",
    pricingEnabled: false,
    pricingMode: "disabled",
    pricingNote: PLANNER_FURNITURE_BOQ_PRICING_DISABLED_NOTE,
    pricingModeLabel: "Pricing off",
  };
}

/** Convenience for workspace hosts that only have the planner feature flag today. */
export function workspaceBoqPricingEnabled(boqPricingEnabled: boolean): boolean {
  return resolvePlannerCommercialPricingAuthority({ boqPricingEnabled }).pricingEnabled;
}
