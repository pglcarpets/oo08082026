import { HOMEPAGE_COLLECTION_IMAGES } from "@/features/site/data/productsPage";

/** Shared fallback when a category or page has no flagship image. */
export const DEFAULT_HERO_FALLBACK = "/assets/marketing/hero/pages/Planner-oneandonly-bright.webp";

/**
 * Homepage UI strings are mirrored in `i18n/messages/en.json` under the `home` namespace (Phase 4a).
 * Regenerate: `pnpm --filter oando-site run i18n:sync:marketing`
 */

/** Poster-first LCP still for homepage hero (slides primary, brightened). */
export const HOMEPAGE_HERO_MEDIA = {
  poster: "/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp",
} as const;

export const HOMEPAGE_HERO_IMAGES = [
  {
    src: HOMEPAGE_HERO_MEDIA.poster,
    alt: "DMRC office workstations installed by One&Only",
  },
  { src: "/assets/marketing/hero/slides/Dmrc-Oneandonly-bright.webp", alt: "DMRC office workstations installed by One&Only" },
  { src: "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp", alt: "TVS Motors regional office fit-out by One&Only" },
  { src: "/assets/marketing/hero/slides/TVS2-Oneandonly-bright.webp", alt: "TVS Motors workspace installation by One&Only" },
  { src: "/assets/marketing/hero/slides/TVS3-Oneandonly-bright.webp", alt: "TVS Motors enterprise fit-out by One&Only" },
  { src: "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp", alt: "Titan corporate workspace by One&Only" },
  { src: "/assets/marketing/hero/slides/Titan2-Oneandonly-bright.webp", alt: "Titan collaborative office by One&Only" },
  { src: "/assets/marketing/hero/slides/Usha-Oneandonly-bright.webp", alt: "Usha Workspace collaboration zones by One&Only" },
] as const;

export interface HomepageHeroGlassProof {
  badge: string;
  lead: string;
  support: string;
  href: string;
  cta: string;
  /** Where the trust claim is sourced from (must be an approved, auditable source). */
  source: string;
  /** Functional owner accountable for the claim's accuracy. */
  owner: string;
  /** Date the claim was last reviewed for accuracy (ISO 8601). */
  reviewDate: string;
}

export interface HomepageHeroContent {
  title: readonly string[];
  kicker: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  glassProof: HomepageHeroGlassProof;
}

export const HOMEPAGE_HERO_CONTENT = {
  title: ["Spaces that work", "harder"],
  kicker: "Pan-India · Since 2011",
  /** Primary path: planner marketing landing. */
  primaryCta: {
    label: "Design layout",
    href: "/planner",
  },
  secondaryCta: { label: "Browse products", href: "/products" },
  glassProof: {
    badge: "Trusted by",
    // Aligned with BUSINESS_STATS_SAFE_DEFAULTS.projectsDelivered (120) and proof/solutions floors.
    lead: "120+ workplaces delivered.",
    support: "Catalog in planner · drafts · branded BOQ.",
    href: "/trusted-by",
    cta: "View clients",
    source: "Internal project records",
    owner: "Marketing",
    reviewDate: "2026-07-18",
  },
} as const satisfies HomepageHeroContent;

/**
 * Resolve i18n / raw hero title lines. Non-array or empty payloads fall back to
 * the TS source of truth so the accessible heading never collapses to "".
 * SITE-HOME-02 / SF-01
 */
export function resolveHeroTitleLines(
  raw: unknown,
  fallback: readonly string[] = HOMEPAGE_HERO_CONTENT.title,
): readonly string[] {
  if (
    Array.isArray(raw) &&
    raw.length > 0 &&
    raw.every((item): item is string => typeof item === "string")
  ) {
    return raw;
  }
  return fallback;
}

/**
 * Join animated / split title lines into one accessible sentence with spaces.
 * Without this, block-level line spans concatenate as "workas" / "asyour".
 * SITE-HOME-02 / SF-01
 */
export function joinAccessibleTitleLines(lines: readonly string[]): string {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ");
}

export const HOMEPAGE_PLANNER_SUITE_CONTENT = {
  titleLead: "Oando",
  titleAccent: "Planner",
  description: "Sketch floors, place catalog items, export.",
  loginHref: "/login/?next=%2Fplanner%2Fcanvas%2F",
  loginLabel: "Member login",
  /** Marketing overview (features / learn more). */
  overviewHref: "/planner",
  overviewLabel: "Learn more",
  /** Primary marketing CTA — planner landing overview. */
  launchHref: "/planner",
  launchLabel: "Launch planner",
} as const;

export interface HomepageTrustContent {
  logoLabel: string;
  logos: ReadonlyArray<{ name: string; src: string }>;
  projectsCta: string;
  /** Where the client list is sourced from (must be an approved, auditable source). */
  source: string;
  /** Functional owner accountable for the list's accuracy. */
  owner: string;
  /** Date the list was last reviewed for accuracy (ISO 8601). */
  reviewDate: string;
}

export const HOMEPAGE_TRUST_CONTENT = {
  logoLabel: "Selected organisations",
  logos: [
    { name: "Titan", src: "/assets/marketing/client-logos/Titan.png" },
    { name: "L&T", src: "/assets/marketing/client-logos/LandT.png" },
    { name: "JSW", src: "/assets/marketing/client-logos/JSW.png" },
    { name: "Tata Motors", src: "/assets/marketing/client-logos/TataMotors.jpg" },
    { name: "Maruti Suzuki", src: "/assets/marketing/client-logos/MarutiSuzuki.png" },
    { name: "HDFC", src: "/assets/marketing/client-logos/HDFCLogo.jpg" },
    { name: "Canara Bank", src: "/assets/marketing/client-logos/CanaraBank.jpg" },
    { name: "Franklin Templeton", src: "/assets/marketing/client-logos/FranklinTempleton.jpg" },
    { name: "Hyundai", src: "/assets/marketing/client-logos/HyundaiLogo.jpg" },
    { name: "IDBI Bank", src: "/assets/marketing/client-logos/IDBIBankLogo.png" },
    { name: "Usha", src: "/assets/marketing/client-logos/USHA.png" },
    { name: "Bihar Government", src: "/assets/marketing/client-logos/BiharGovernment.jpg" },
    { name: "SAIL", src: "/assets/marketing/client-logos/SAIL.png" },
    { name: "BIS", src: "/assets/marketing/client-logos/BIS.jpg" },
    { name: "Sonalika", src: "/assets/marketing/client-logos/Sonalika.jpg" },
    { name: "Survey of India", src: "/assets/marketing/client-logos/SurveyofIndia.jpg" },
    { name: "CRI Pumps", src: "/assets/marketing/client-logos/CRIPumps.jpg" },
    { name: "MECON", src: "/assets/marketing/client-logos/MECON.jpg" },
  ],
  projectsCta: "View projects",
  source: "Internal client records",
  owner: "Marketing",
  reviewDate: "2026-07-14",
} as const satisfies HomepageTrustContent;

export const HOMEPAGE_BRAND_STATEMENT_CONTENT = {
  lead: "Workplaces planned and installed across India since 2011.",
  body:
    "Focus, collaboration, and dependable delivery — not interiors for show.",
} as const;

/**
 * Homepage-only “Browse categories” band.
 * Product-focused marketing tiles (chair / desk / cabin table / sofa / etc.).
 * Paths under marketing/ui only — not header or other pages’ primary heroes.
 */
export const HOMEPAGE_COLLECTIONS_CONTENT = {
  titleLead: "Browse",
  titleAccent: "categories",
  catalogCta: { label: "Full catalog", href: "/products" },
  items: [
    {
      name: "Seating",
      image: HOMEPAGE_COLLECTION_IMAGES.seating,
      alt: "Ergonomic office chair",
      href: "/products/seating",
    },
    {
      name: "Workstations",
      image: HOMEPAGE_COLLECTION_IMAGES.workstations,
      alt: "Office workstation desk",
      href: "/products/workstations",
    },
    {
      name: "Tables",
      image: HOMEPAGE_COLLECTION_IMAGES.tables,
      alt: "Cabin and meeting table",
      href: "/products/tables",
    },
    {
      name: "Storage",
      image: HOMEPAGE_COLLECTION_IMAGES.storages,
      alt: "Office storage cabinets",
      href: "/products/storages",
    },
    {
      name: "Soft Seating",
      image: HOMEPAGE_COLLECTION_IMAGES["soft-seating"],
      alt: "Lounge sofa soft seating",
      href: "/products/soft-seating",
    },
    {
      name: "Education",
      image: "/assets/marketing/ui/categories/education-clean.webp",
      alt: "School desk and chair",
      href: "/products/education",
    },
  ],
} as const;

export const HOMEPAGE_PROJECTS_CONTENT = {
  titleLead: "Recent",
  titleAccent: "projects",
  cta: { label: "View clients", href: "/clients" },
  cards: [
    { name: "DMRC", image: "/assets/marketing/clients/DMRC/dmrc-1.webp" },
    { name: "Titan Limited", image: "/assets/marketing/clients/Titan/hero.webp" },
    { name: "TVS Motors", image: "/assets/marketing/clients/TVS/tvs.webp" },
  ],
} as const;

export const HOMEPAGE_SHOWCASE_CONTENT = {
  sectionLabel: "Selected projects",
  sectionTitleLead: "Recent",
  sectionTitleAccent: "installs",
  browseCta: { label: "View clients", href: "/clients" },
  items: [
    {
      id: "dmrc",
      name: "DMRC",
      label: "",
      image: "/assets/marketing/clients/DMRC/dmrc-1.webp",
      link: "/clients",
    },
    {
      id: "titan",
      name: "Titan",
      label: "",
      image: "/assets/marketing/clients/Titan/hero.webp",
      link: "/clients",
    },
    {
      id: "tvs",
      name: "TVS",
      label: "",
      image: "/assets/marketing/clients/TVS/tvs.webp",
      link: "/clients",
    },
  ],
} as const;

export const HOMEPAGE_CONTACT_CONTENT = {
  titleLead: "Share a",
  titleAccent: "brief",
  subtitle: "City, scope, timeline — we follow up by phone or email.",
  /** Workplace still — fills the intro column so the band is not title-only void. */
  image: {
    src: "/assets/marketing/hero/pages/contact-oneandonly-bright.webp",
    alt: "Corporate workspace installed by One&Only",
  },
  directActions: [
    {
      type: "whatsapp",
      label: "WhatsApp now",
      detail: "Fastest response",
    },
    {
      type: "phone",
      label: "Call team",
      detail: "Talk to support",
    },
  ],
} as const;

export const HOMEPAGE_CLOSING_CTA_CONTENT = {
  kicker: "Start planning",
  titleLead: "Start with one",
  titleAccent: "clear brief.",
  description:
    "Share your city, scope, and timeline. We will route the right next step without forcing the whole brief into the home page.",
  actions: {
    primary: { label: "Planning service", href: "/planning" },
    whatsapp: {
      label: "WhatsApp now",
      message: "I need help starting a workspace planning brief.",
    },
    phone: { label: "Call team" },
  },
} as const;

/**
 * Homepage KPI strip. Project/client floors match `TRUSTED_BY_STATS` and
 * SOLUTIONS_PAGE_COPY.stats — do not inflate above `BUSINESS_STATS_SAFE_DEFAULTS`
 * without a dated internal source review.
 */
export const HOMEPAGE_STATS_CONTENT = [
  { value: "14+", label: "Years delivering workspaces" },
  { value: "120+", label: "Projects completed" },
  { value: "50+", label: "Partner brands and product lines" },
  { value: "24/7", label: "After-sales support routing" },
] as const;

export const HOMEPAGE_PROCESS_CONTENT = {
  kicker: "",
  titleLead: "A clear",
  titleAccent: "delivery system.",
  description: "",
  cta: { label: "Guided Planner", href: "/contact" },
  steps: [
    {
      title: "Scope",
      sla: "Day 1-2",
      deliverable: "Signed brief",
      description: "Needs workshop, headcount, zones, and bill of materials.",
    },
    {
      title: "Design",
      sla: "Day 3-7",
      deliverable: "Approved layout",
      description: "2D layout and material board submitted for sign-off.",
    },
    {
      title: "Deliver",
      sla: "Approved schedule",
      deliverable: "Installed workspace",
      description: "Factory-built, delivered, and installed to spec.",
    },
    {
      title: "Support",
      sla: "Ongoing",
      deliverable: "Service support",
      description: "Warranty coverage and dedicated after-sales contact.",
    },
  ],
} as const;

export type HomepageSectorIconName =
  | "Landmark"
  | "Building2"
  | "Factory"
  | "Car"
  | "Zap"
  | "Globe";

export const HOMEPAGE_SECTORS_CONTENT = {
  eyebrow: "Sectors we serve",
  titleLead: "Trusted across",
  titleAccent: "large-scale workplaces",
} as const;

export const HOMEPAGE_SECTORS = [
  {
    name: "Government",
    iconName: "Landmark",
    href: "/clients",
    displayCount: 24,
    clients: ["DMRC", "Patna Metro", "Bihar Government"],
  },
  {
    name: "Corporate",
    iconName: "Building2",
    href: "/clients",
    displayCount: 16,
    clients: ["Titan", "HDFC", "TVS Motors"],
  },
  {
    name: "Industrial",
    iconName: "Factory",
    href: "/clients",
    displayCount: 12,
    clients: ["Tata Steel", "JSW", "SAIL"],
  },
  {
    name: "Automotive",
    iconName: "Car",
    href: "/clients",
    displayCount: 9,
    clients: ["TVS", "Maruti Suzuki", "Tata Motors"],
  },
  {
    name: "Technology",
    iconName: "Zap",
    href: "/clients",
    displayCount: 8,
    clients: ["Usha", "Bihar Government", "Patna Metro"],
  },
  {
    name: "International",
    iconName: "Globe",
    href: "/clients",
    displayCount: 5,
    clients: ["Global partners", "Enterprise accounts", "Export workflows"],
  },
] as const;

export const HOMEPAGE_SOLUTIONS_CONTENT = {
  kicker: "Workspace routes",
  title: "Browse by workspace need.",
  description: "Explore office furniture and workspace systems by category.",
  compareCta: "Compare product options",
  catalogCta: "Browse full catalog",
  mobileHint: "Swipe to browse categories",
  capabilities: [
    {
      title: "Ergonomic Seating",
      outcome:
        "Task and executive seating tuned for posture support, long-hour comfort, and dependable after-sales coverage.",
      href: "/products/seating",
      image: HOMEPAGE_COLLECTION_IMAGES.seating,
    },
    {
      title: "Scalable Workstations",
      outcome:
        "Modular systems that scale team by team with practical cable management and planning-friendly layouts.",
      href: "/products/workstations",
      image: HOMEPAGE_COLLECTION_IMAGES.workstations,
    },
    {
      title: "Meeting Tables",
      outcome:
        "Table systems for collaboration, review, and client-facing discussion zones.",
      href: "/products/tables",
      image: HOMEPAGE_COLLECTION_IMAGES.tables,
    },
    {
      title: "Storage Systems",
      outcome:
        "Lockers, pedestals, and cabinets built for secure daily use with efficient footprint planning.",
      href: "/products/storages",
      image: HOMEPAGE_COLLECTION_IMAGES.storages,
    },
  ],
} as const;

export const HOMEPAGE_WHY_CHOOSE_US_CONTENT = {
  titleLead: "We engineer",
  titleAccent: "workspaces",
} as const;

export const HOMEPAGE_TESTIMONIALS_CONTENT = {
  titleLead: "Client",
  titleAccent: "speak",
  items: [
    {
      quote:
        "The layout planning before production saved us significant rework. The team understood our floor constraints without us having to explain twice.",
      author: "Facilities Head",
      org: "Titan Limited, Patna",
    },
    {
      quote:
        "We needed a phased rollout across two floors with minimal downtime. The delivery and installation was coordinated well and completed on schedule.",
      author: "Admin Manager",
      org: "Government of Bihar",
    },
    {
      quote:
        "After-sales response time was faster than we expected. The warranty claim was resolved in one visit.",
      author: "Office Manager",
      org: "HDFC, Patna",
    },
  ],
} as const;

export const HOMEPAGE_FAQ_CONTENT = {
  titleLead: "FAQ",
  items: [
    {
      q: "Which cities do you serve?",
      a: "We deliver commercial office furniture across India, including multi-city and multi-floor rollouts. Logistics are coordinated by our team — no third-party intermediaries.",
    },
    {
      q: "How long does delivery and installation take?",
      a: "Scope and design is completed within 7 working days of brief sign-off. Delivery and installation timelines depend on order volume and are agreed in writing before production begins.",
    },
    {
      q: "Is installation included in the price?",
      a: "Yes. All orders include delivery to site and supervised installation by our team. Post-installation snag support is also covered.",
    },
    {
      q: "What warranty do you offer?",
      a: "Products carry manufacturer warranty (typically 2-5 years depending on the range). After-sales support is managed by our team directly.",
    },
    {
      q: "Can you handle large or phased office rollouts?",
      a: "Yes. We have executed government and corporate rollouts across multiple floors and sites. Use the Guided Planner to share your brief and we will route the right next step.",
    },
  ],
} as const;

/** Legacy ribbon data only — banner is not mounted on homepage. One&Only branding only. */
export const HOMEPAGE_PARTNERSHIP_CONTENT = {
  image: {
    src: "/logo.webp",
    alt: "One&Only",
  },
  title: ["One&Only", "Office Furniture"],
} as const;
