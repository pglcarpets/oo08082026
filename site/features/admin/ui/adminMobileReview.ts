/**
 * ADM-MOB-01..03 — phone Admin review declarations (no new CSS theme tree).
 * Pure copy + breakpoints for existing admin media queries.
 */

/** Authoring block threshold (SVG studio / bulk import). */
export const ADMIN_PHONE_MAX_WIDTH_REM = 60;

/**
 * Cards-priority media in locked admin CSS (`max-width: 48rem`).
 * Catalog / inventory phone cards switch on this breakpoint.
 */
export const ADMIN_PHONE_CARDS_MAX_WIDTH_REM = 48;

/** WCAG 2.5.5 target floor used by admin phone CSS (`min-height: 2.75rem`). */
export const ADMIN_PHONE_MIN_TAP_PX = 44;

/** Locked rem equivalent of {@link ADMIN_PHONE_MIN_TAP_PX} at 16px root. */
export const ADMIN_PHONE_MIN_TAP_REM = 2.75;

export type AdminPhoneCapability =
  | "list-review"
  | "price-book-review"
  | "svg-authoring"
  | "bulk-import";

export type AdminPhoneCapabilityStatus = {
  readonly capability: AdminPhoneCapability;
  readonly supported: boolean;
  readonly declaration: string;
};

export function adminPhoneCapabilities(): readonly AdminPhoneCapabilityStatus[] {
  return [
    {
      capability: "list-review",
      supported: true,
      declaration:
        "Phone review: inventory uses stacked cards / priority columns (no page-level horizontal scroll).",
    },
    {
      capability: "price-book-review",
      supported: true,
      declaration: "Phone review: price books remain readable in stacked panels.",
    },
    {
      capability: "svg-authoring",
      supported: false,
      declaration:
        "SVG studio authoring is unsupported on phone. Use a desktop or tablet ≥ 60rem width.",
    },
    {
      capability: "bulk-import",
      supported: false,
      declaration:
        "Bulk CSV import is unsupported on phone. Use desktop Admin.",
    },
  ];
}

export function phoneAuthoringBlockedMessage(): string {
  return (
    adminPhoneCapabilities().find((c) => c.capability === "svg-authoring")
      ?.declaration ?? "Authoring unsupported on phone."
  );
}

export function phoneBulkImportBlockedMessage(): string {
  return (
    adminPhoneCapabilities().find((c) => c.capability === "bulk-import")
      ?.declaration ?? "Bulk import unsupported on phone."
  );
}

/**
 * Compact operator notice for SVG inventory (ADM-MOB-01 + ADM-MOB-02).
 * List review is supported; studio + bulk need desktop.
 */
export function phoneSvgListReviewNotice(): string {
  return (
    "Phone: inventory review only. Open the SVG studio and bulk import on desktop " +
    `(width ≥ ${ADMIN_PHONE_MAX_WIDTH_REM}rem).`
  );
}

/** Markup + CSS contract for catalog / inventory phone lists (AF-06). */
export function phoneListLayoutMode(): "cards-priority" {
  return "cards-priority";
}

/** Cell labels required on managed catalog phone cards (AF-06). */
export const ADMIN_CATALOG_PHONE_CELL_LABELS = [
  "Name",
  "Category",
  "Size",
  "Status",
  "Actions",
] as const;

export type AdminCatalogPhoneCellLabel =
  (typeof ADMIN_CATALOG_PHONE_CELL_LABELS)[number];

/** Cell labels required on SVG inventory phone cards (ADM-MOB-03 / AF-06). */
export const ADMIN_SVG_PHONE_CELL_LABELS = [
  "Preview",
  "Product",
  "Size",
  "Lifecycle",
  "Symbol",
  "Updated",
  "Actions",
] as const;

export type AdminSvgPhoneCellLabel =
  (typeof ADMIN_SVG_PHONE_CELL_LABELS)[number];
