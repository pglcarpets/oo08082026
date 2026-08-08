/**
 * Solutions hub media, category tiles, and category-detail copy/media.
 * Hero: graded poster + Ken Burns loop (reduced-motion → poster only).
 */
import type { SolutionCategoryId } from "@/features/site/data/routeClassification";

export const SOLUTIONS_HERO_IMAGE = {
  src: "/assets/marketing/hero/pages/solutions-oneandonly-bright.webp",
  alt: "Complete workplace furniture and planning by One&Only",
} as const;

export const SOLUTIONS_HERO_MEDIA = {
  poster: SOLUTIONS_HERO_IMAGE.src,
} as const;

/** Marketing UI tiles (watermark-free crops under marketing/ui/categories). */
const UI_CAT = "/assets/marketing/ui/categories";

export const SOLUTION_CATEGORIES = [
  {
    title: "Workstations",
    href: "/solutions/workstations",
    image: `${UI_CAT}/workstations-clean.webp`,
  },
  {
    title: "Seating",
    href: "/solutions/seating",
    image: `${UI_CAT}/seating-clean.webp`,
  },
  {
    title: "Tables",
    href: "/solutions/tables",
    image: `${UI_CAT}/tables-clean.webp`,
  },
  {
    title: "Storage",
    href: "/solutions/storages",
    image: `${UI_CAT}/storages-clean.webp`,
  },
  {
    title: "Soft seating",
    href: "/solutions/soft-seating",
    image: `${UI_CAT}/soft-seating-clean.webp`,
  },
  {
    title: "Education",
    href: "/solutions/education",
    image: `${UI_CAT}/education-clean.webp`,
  },
] as const;

export type SolutionCategoryDetail = {
  /** Absolute metadata title (e.g. "Seating Solutions"). */
  title: string;
  titleLead: string;
  titleAccent: string;
  description: string;
  image: string;
  imageAlt: string;
  productsHref: string;
};

export const SOLUTION_CATEGORY_DETAILS: Record<
  SolutionCategoryId,
  SolutionCategoryDetail
> = {
  seating: {
    title: "Seating Solutions",
    titleLead: "Seating",
    titleAccent: "solutions.",
    description: "Ergonomic seating solutions for focused and collaborative work.",
    image: `${UI_CAT}/seating-clean.webp`,
    imageAlt: "Task seating specified for focused and collaborative work",
    productsHref: "/products/seating",
  },
  workstations: {
    title: "Workstation Solutions",
    titleLead: "Workstation",
    titleAccent: "solutions.",
    description:
      "Modular workstation systems for growing teams and evolving office layouts.",
    image: `${UI_CAT}/workstations-clean.webp`,
    imageAlt: "Modular workstation systems in an active office layout",
    productsHref: "/products/workstations",
  },
  tables: {
    title: "Table Solutions",
    titleLead: "Table",
    titleAccent: "solutions.",
    description:
      "Meeting, cabin, and training table solutions for modern office workflows.",
    image: `${UI_CAT}/tables-clean.webp`,
    imageAlt: "Meeting and cabin tables for modern office workflows",
    productsHref: "/products/tables",
  },
  storages: {
    title: "Storage Solutions",
    titleLead: "Storage",
    titleAccent: "solutions.",
    description: "Secure and flexible storage systems for organized workplaces.",
    image: `${UI_CAT}/storages-clean.webp`,
    imageAlt: "Workplace storage systems for organized offices",
    productsHref: "/products/storages",
  },
  "soft-seating": {
    title: "Soft Seating Solutions",
    titleLead: "Soft seating",
    titleAccent: "solutions.",
    description:
      "Lounge and collaborative seating solutions for breakout and reception areas.",
    image: `${UI_CAT}/soft-seating-clean.webp`,
    imageAlt: "Lounge soft seating for breakout and reception areas",
    productsHref: "/products/soft-seating",
  },
  education: {
    title: "Education Solutions",
    titleLead: "Education",
    titleAccent: "solutions.",
    description:
      "Furniture solutions for classrooms, libraries, hostels, and auditoriums.",
    image: `${UI_CAT}/education-clean.webp`,
    imageAlt: "Education furniture for classrooms and learning spaces",
    productsHref: "/products/education",
  },
};
