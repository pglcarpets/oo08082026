import { readSiteAttribution } from "@/lib/analytics/siteAttribution";

export interface PlannerEntryContext {
  readonly sourcePage: string;
  readonly surface: string;
  readonly productSlug?: string;
  readonly categoryId?: string;
  readonly campaign?: string;
}

/**
 * Site → Planner entry contract
 *
 * 1. Marketing / nav / home (no product identity):
 *    `GUEST_PLANNER_CHOOSER_HREF` → `/choose-product?mode=guest`
 *    then chooser opens the guest workspace.
 * 2. Product-aware (PDP "Design in Planner"):
 *    deep-link `GUEST_PLANNER_WORKSPACE_HREF` (`/planner/guest`) with
 *    `siteProduct` / `siteCategory` / `siteSource` via `buildPlannerEntryHref`
 *    or `PlannerLaunchLink` — lower friction than re-choosing a product.
 *
 * Guest draft-id redirect preserves `PLANNER_ENTRY_QUERY_KEYS`.
 * Guest UI banner (`SiteProductContinuityNotice`) reads `siteProduct`.
 * Inventory focus: `WorkspaceLeftPanel` → `InventoryPanel` `focusProductSlug`
 * via `matchCatalogItemBySiteProduct` (select/highlight only; no auto-place).
 */
export const GUEST_PLANNER_WORKSPACE_HREF = "/ooplanner";
export const GUEST_PLANNER_CHOOSER_HREF = "/choose-product?mode=guest";

/** Site stamps these on planner entry URLs; guest id redirect must keep them. */
export const PLANNER_ENTRY_QUERY_KEYS = [
  "siteProduct",
  "siteCategory",
  "siteSource",
  "utm_source",
  "utm_medium",
  "utm_campaign",
] as const;

export type PlannerEntrySearchParams = Record<
  string,
  string | string[] | undefined
>;

/** True for workspace entry paths only (not help/features/landing marketing). */
export function isPlannerEntryHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  if (normalized === "/ooplanner" || normalized.startsWith("/ooplanner/")) {
    return true;
  }
  if (!normalized.startsWith("/planner")) {return false;}
  if (normalized.startsWith("/planner/help")) {return false;}
  if (normalized.startsWith("/planner/features")) {return false;}
  // Bare /planner marketing landing — navigate there directly (header "Planner" nav).
  if (isBarePlannerLandingHref(normalized)) {return false;}
  return true;
}

/** Bare `/planner` overview — not a guest canvas; product deep-links must not land here. */
export function isBarePlannerLandingHref(href: string): boolean {
  try {
    const url = new URL(href, "https://oneonly.in");
    const path = url.pathname.replace(/\/+$/, "") || "/";
    return path === "/planner";
  } catch {
    return false;
  }
}

export function buildPlannerEntryCampaign(context: PlannerEntryContext): string | undefined {
  const parts: string[] = [];
  if (context.productSlug) {
    parts.push(`product:${context.productSlug}`);
  }
  if (context.categoryId) {
    parts.push(`category:${context.categoryId}`);
  }
  if (context.surface) {
    parts.push(`surface:${context.surface}`);
  }
  const attribution = readSiteAttribution();
  if (attribution.campaign) {
    parts.push(`utm:${attribution.campaign}`);
  }
  return parts.length > 0 ? parts.join("|") : context.campaign;
}

export interface BuildPlannerEntryHrefOptions {
  /** Cookie-based utm_* params differ between SSR and client — omit in rendered links. */
  readonly includeAttribution?: boolean;
}

/**
 * Stamp continuity params onto a planner workspace href.
 * When a product slug is present and the base is bare `/planner` overview,
 * upgrade to guest workspace so PDP never drops into marketing landing.
 */
export function buildPlannerEntryHref(
  baseHref: string,
  context: Pick<PlannerEntryContext, "sourcePage" | "productSlug" | "categoryId">,
  options?: BuildPlannerEntryHrefOptions,
): string {
  const resolvedBase =
    context.productSlug && isBarePlannerLandingHref(baseHref)
      ? GUEST_PLANNER_WORKSPACE_HREF
      : baseHref;
  const url = new URL(resolvedBase, "https://oneonly.in");
  if (context.productSlug) {
    url.searchParams.set("siteProduct", context.productSlug);
  }
  if (context.categoryId) {
    url.searchParams.set("siteCategory", context.categoryId);
  }
  url.searchParams.set("siteSource", context.sourcePage);
  if (options?.includeAttribution) {
    const attribution = readSiteAttribution();
    if (attribution.source && attribution.source !== "direct") {
      url.searchParams.set("utm_source", attribution.source);
    }
    if (attribution.medium && attribution.medium !== "none") {
      url.searchParams.set("utm_medium", attribution.medium);
    }
    if (attribution.campaign) {
      url.searchParams.set("utm_campaign", attribution.campaign);
    }
  }
  return `${url.pathname}${url.search}`;
}

/**
 * PDP / product-aware deep link: guest workspace + continuity params.
 * Prefer this over the chooser when the product is already known.
 */
export function buildProductAwareGuestPlannerHref(
  context: Pick<PlannerEntryContext, "sourcePage" | "productSlug" | "categoryId">,
  options?: BuildPlannerEntryHrefOptions,
): string {
  return buildPlannerEntryHref(GUEST_PLANNER_WORKSPACE_HREF, context, options);
}

/**
 * Copy Site continuity params from inbound searchParams.
 * Ignores arrays (ambiguous) and empty strings.
 */
export function pickPlannerEntrySearchParams(
  searchParams: PlannerEntrySearchParams,
): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of PLANNER_ENTRY_QUERY_KEYS) {
    const raw = searchParams[key];
    if (typeof raw === "string" && raw.trim().length > 0) {
      out.set(key, raw);
    }
  }
  return out;
}

/** Bare guest URL → new draft id without dropping Site product/source params. */
export function buildGuestPlannerDraftRedirectHref(
  planId: string,
  searchParams?: PlannerEntrySearchParams,
): string {
  const params = pickPlannerEntrySearchParams(searchParams ?? {});
  params.set("id", planId);
  return `/ooplanner/?${params.toString()}`;
}

/**
 * Member canvas without session → public guest **chooser** step first
 * (`/choose-product?mode=guest`), keeping Site continuity params.
 * Direct `/planner/guest?id=` deep links remain valid for resume/e2e.
 */
export function buildGuestPlannerEntryHref(
  searchParams?: PlannerEntrySearchParams,
): string {
  const params = pickPlannerEntrySearchParams(searchParams ?? {});
  params.set("mode", "guest");
  const qs = params.toString();
  return `/choose-product/?${qs}`;
}

/** Non-empty siteProduct from inbound planner entry params. */
export function readPlannerEntrySiteProduct(
  searchParams: PlannerEntrySearchParams,
): string | undefined {
  const raw = searchParams.siteProduct;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim();
  }
  return undefined;
}

/**
 * Humanize a siteProduct slug for guest continuity copy
 * (`super-chair-001` → `Super Chair`).
 */
export function humanizeSiteProductSlug(slug: string): string {
  const trimmed = slug.trim();
  if (!trimmed) {return "product";}

  const withoutSerial = trimmed.replace(/-\d{2,}$/i, "");
  const spaced = withoutSerial
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!spaced) {return "product";}

  return spaced
    .split(" ")
    .map((word) => {
      if (/^v\d+/i.test(word)) {return word.toUpperCase();}
      if (word.length <= 2 && word === word.toUpperCase()) {return word;}
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/** Non-blocking guest banner/toast copy when Site stamped a product. */
export function formatSiteProductContinuityMessage(productSlug: string): string {
  return `Designing with ${humanizeSiteProductSlug(productSlug)}`;
}