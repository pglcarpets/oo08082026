import { DEFAULT_HERO_FALLBACK } from "@/features/site/data/homepage";
import { GUEST_PLANNER_CHOOSER_HREF } from "@/lib/analytics/plannerEntry";
import { PRODUCT_SUITE } from "@/features/site/data/productSuite";
import { PLANNER_FEATURE_PAGES } from "./plannerFeaturePages";

export { PLANNER_FEATURE_PAGES };

/** Features hub hero backdrop — shared marketing family photo */
export const PLANNER_HERO_IMAGES = [
  {
    src: DEFAULT_HERO_FALLBACK,
    alt: "Team reviewing an office floor plan before furniture procurement",
  },
] as const;

export const PLANNER_HERO = {
  titleLead: "Plan your ",
  titleAccent: "office",
  description: "True-scale floor plans, real catalog furniture, PDF export.",
  primaryCta: {
    label: "Start free",
    href: GUEST_PLANNER_CHOOSER_HREF,
  },
  secondaryCta: {
    label: "Sign in",
    href: `${PRODUCT_SUITE.shared.routes.access}?next=${encodeURIComponent("/ooplanner/")}`,
  },
  featuresCta: {
    label: "All features",
    href: "/planner/features/",
  },
  helpCta: {
    label: "Help",
    href: "/planner/help/",
  },
  bottomCta: {
    title: "Start free — no account required.",
    memberLoginLabel: "Sign in",
  },
} as const;

export const PLANNER_PROOF = [
  { value: "Import sketch", label: "JPG or PNG upload" },
  { value: "Export plan", label: "Branded PDF" },
  { value: "Start free", label: "No payment" },
] as const;

export const PLANNER_LANDING_FEATURE_SLUGS = [
  "measure",
  "catalog",
  "ai-assist",
  "export",
] as const;

export const PLANNER_LANDING_FEATURE_CARDS = [
  { slug: "measure", title: "Room sizes" },
  { slug: "catalog", title: "Catalog drop-in" },
  { slug: "ai-assist", title: "AI assist" },
  { slug: "export", title: "PDF export" },
] as const;

export const PLANNER_LANDING_FEATURES = PLANNER_LANDING_FEATURE_CARDS.map((card) => {
  const page = PLANNER_FEATURE_PAGES.find((entry) => entry.slug === card.slug);
  if (!page) throw new Error(`Missing planner feature: ${card.slug}`);
  return {
    slug: card.slug,
    href: `/planner/features/${page.slug}/`,
    title: card.title,
    tagline: page.tagline,
  };
});

export const PLANNER_HOW_IT_WORKS = {
  eyebrow: "How it works",
  titleBefore: "Three steps from blank floor to ",
  titleAccent: "shareable",
  titleAfter: " layout",
} as const;

export const PLANNER_STEPS = [
  { step: "01", title: "Sketch your floor" },
  { step: "02", title: "Drop in catalog furniture" },
  { step: "03", title: "Export & quote" },
] as const;
