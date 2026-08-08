import "server-only";

import {
  getPriceBookVersion,
  type PriceBookContract,
} from "./priceBookContract";
import {
  DEFAULT_PRICE_BOOK_ID,
  readAdminPriceBook,
} from "./priceBookAdmin.server";
import {
  resolvePlannerCommercialPricingAuthority,
  type PlannerCommercialPricingAuthority,
} from "./plannerPricingAuthority";

export type WorkspaceCommercialPricing = {
  authority: PlannerCommercialPricingAuthority;
  priceBook: PriceBookContract | null;
  priceBookVersionId: string | null;
};

/**
 * Resolve planner workspace commercial pricing from admin price-book state.
 * Live layer applies only when an active version is pinned on the default book.
 */
export async function resolveWorkspaceCommercialPricing(input: {
  boqPricingEnabled?: boolean;
  /** Injectable store root for isolated tests. */
  dir?: string;
}): Promise<WorkspaceCommercialPricing> {
  const snapshot = await readAdminPriceBook(DEFAULT_PRICE_BOOK_ID, input.dir);
  const contract = snapshot?.contract ?? null;
  const activeVersionId = contract?.activeVersionId ?? null;
  const activeVersion =
    contract && activeVersionId
      ? getPriceBookVersion(contract, activeVersionId)
      : null;
  const liveBookActive =
    Boolean(contract && activeVersionId && activeVersion?.status === "active");

  const authority = resolvePlannerCommercialPricingAuthority({
    boqPricingEnabled: input.boqPricingEnabled ?? false,
    activePriceBookId: liveBookActive ? contract?.bookId ?? null : null,
  });

  return {
    authority,
    priceBook: liveBookActive ? contract : null,
    priceBookVersionId: liveBookActive ? activeVersionId : null,
  };
}
