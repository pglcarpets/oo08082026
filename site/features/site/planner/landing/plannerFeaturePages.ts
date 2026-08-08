import type { Icon } from "@phosphor-icons/react";
// SSR entry: CSR icons call createContext at module eval — breaks next build page-data
// collection when this module is imported from Server Components (features/[slug]/page).
import { FileText, Stack as Layers3, Ruler, Sparkle as Sparkles } from "@phosphor-icons/react/dist/ssr";

export type PlannerFeaturePage = {
  slug: string;
  title: string;
  tagline: string;
  icon: Icon;
  summary: string;
  bullets: string[];
  helpSectionId: string;
  tryPath: string;
  memberPath: string;
  /** Slugs of complementary features cross-linked from the detail page */
  relatedSlugs: string[];
};

export const PLANNER_FEATURE_PAGES: PlannerFeaturePage[] = [

  {
    slug: "measure",
    title: "Check room sizes before you commit to furniture orders",
    tagline: "Dimensions and area totals",
    icon: Ruler,
    summary:
      "Measure walls, check room areas, and confirm everything fits — so you can walk into procurement meetings with numbers, not guesses.",
    bullets: [
      "Click any wall or span to see its length in millimetres",
      "Room and zone areas add up automatically as you draw",
      "Measurements match what you will see on exported PDFs",
    ],
    helpSectionId: "measurements",
    tryPath: "/ooplanner/",
    memberPath: "/ooplanner/",
    relatedSlugs: ["export"],
  },
  {
    slug: "catalog",
    title: "Drag and drop desks and cabinets to see your floor instantly",
    tagline: "Real furniture, real sizes",
    icon: Layers3,
    summary:
      "Pick desks, benches, storage, and meeting tables from the One&Only catalog — every item drops in at its actual dimensions.",
    bullets: [
      "Search and filter by product family — workstations, storage, meeting tables",
      "Drag from the library or click to place items on your floor plan",
      "Every symbol matches a real One&Only product, not generic clip art",
      "Resize, rotate, and adjust seating count from the side panel",
    ],
    helpSectionId: "catalog-and-blocks",
    tryPath: "/ooplanner/",
    memberPath: "/ooplanner/",
    relatedSlugs: ["ai-assist", "export"],
  },
  {
    slug: "ai-assist",
    title: "Describe your office and get a starting layout in seconds",
    tagline: "Help when you are not sure where to begin",
    icon: Sparkles,
    summary:
      "Tell the planner how many people you need to seat and what kind of space you have — it suggests a starting arrangement you can adjust.",
    bullets: [
      "Upload a hand-drawn sketch to instantly generate your floor plan",
      "Chat about your room size, headcount, and layout goals",
      "Pick from common office templates — open plan, cabins, hybrid",
      "Preview suggested furniture placements before you commit",
      "Works in guest mode so you can explore before signing in",
    ],
    helpSectionId: "ai-assistant",
    tryPath: "/ooplanner/",
    memberPath: "/ooplanner/",
    relatedSlugs: ["catalog", "export"],
  },
  {
    slug: "export",
    title: "Send a PDF layout and quote request to your vendor in one click",
    tagline: "Share with procurement or leadership",
    icon: FileText,
    summary:
      "Download a branded PDF floor plan with an itemised quote table — ready to email to your vendor, facilities head, or finance team.",
    bullets: [
      "Export a polished PDF from the toolbar in one click",
      "Save your layout as a file for backup or handoff to a colleague",
      "Quote table lists every catalog item you placed, with quantities",
      "Signed-in members can save projects and return to them later",
    ],
    helpSectionId: "export-and-share",
    tryPath: "/ooplanner/",
    memberPath: "/ooplanner/",
    relatedSlugs: ["measure", "catalog"],
  },
];

export type PlannerFeatureSlug = (typeof PLANNER_FEATURE_PAGES)[number]["slug"];

export const PLANNER_FEATURE_BY_SLUG = Object.fromEntries(
  PLANNER_FEATURE_PAGES.map((page) => [page.slug, page]),
) as Record<PlannerFeatureSlug, PlannerFeaturePage>;

export function isPlannerFeatureSlug(slug: string): slug is PlannerFeatureSlug {
  return slug in PLANNER_FEATURE_BY_SLUG;
}