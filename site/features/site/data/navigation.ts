import { SITE_CONTACT } from "@/features/site/data/contact";
import { PRODUCT_SUITE } from "@/features/site/data/productSuite";

/**
 * Marketing header + mobile drawer destinations.
 * Products opens the category mega menu (desktop) / accordion (mobile).
 * Secondary destinations live as direct footer links (no "More" dropdown).
 */
export const SITE_NAV_LINKS = [
  { label: "Products", href: "/products", hasMega: true },
  { label: "Solutions", href: "/solutions" },
  { label: "Clients", href: "/clients" },
  /** Marketing planner landing (/planner). */
  { label: "Planner", href: PRODUCT_SUITE.planner.routes.landing },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export type SiteNavLink = (typeof SITE_NAV_LINKS)[number];

/** Desktop + mobile center nav — same flat list. */
export const SITE_HEADER_PRIMARY_LINKS = SITE_NAV_LINKS;

/** @deprecated Empty — no header dropdown. Secondary routes are footer-only. */
export const SITE_HEADER_MORE_LINKS: readonly SiteNavLink[] = [];

export const SITE_CTA_LINKS = [
  { label: "Get Quote", href: "/contact", variant: "primary" as const },
  { label: "View Products", href: "/products", variant: "outline" as const },
] as const;

/** Canonical member sign-in (login route redirects here). */
export const SITE_AUTH_LINK = { label: "Sign in", href: "/access" } as const;

/** Mega-menu featured cards (search + featured surfaces). */
export const SITE_NAV_FEATURED_CARDS = [
  {
    title: "Ergonomic Seating",
    description: "Mesh chairs and premium seating for long working hours.",
    href: "/products/seating",
    image: "/assets/marketing/ui/categories/seating-clean.webp",
  },
  {
    title: "Modular Workstations",
    description: "Scalable desking systems for growing teams.",
    href: "/products/workstations",
    image: "/assets/marketing/ui/categories/workstations-clean.webp",
  },
  {
    title: "Need Help Choosing?",
    description: "Use AI-assisted search to find the right furniture faster.",
    href: "/products",
    image: "/assets/marketing/clients/Titan/titan-office.webp",
  },
] as const;

export const SITE_NAV_SEARCH_FALLBACK_LINKS = [
  { href: "/products", label: "All Products" },
  { href: "/solutions", label: "Solutions" },
  { href: "/clients", label: "Clients" },
  { href: PRODUCT_SUITE.planner.routes.landing, label: "Planner" },
  { href: PRODUCT_SUITE.planner.routes.help, label: "Planner help" },
  { href: "/trusted-by", label: "Trusted By" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/contact", label: "Contact" },
] as const;

type FooterLink = { href: string; label: string };

export function normalizeFooterHref(href: string): string {
  if (href.length > 1 && href.endsWith("/")) {return href.slice(0, -1);}
  return href;
}

/** Drop duplicate destinations across footer columns (first label wins). */
export function buildFooterNav(
  sections: { heading: string; links: readonly FooterLink[] }[],
): { heading: string; links: FooterLink[] }[] {
  const globalSeen = new Set<string>();

  return sections
    .map((section) => ({
      heading: section.heading,
      links: section.links.filter((link) => {
        const key = normalizeFooterHref(link.href);
        if (globalSeen.has(key)) {return false;}
        globalSeen.add(key);
        return true;
      }),
    }))
    .filter((section) => section.links.length > 0);
}

/**
 * Public footer — all secondary destinations as direct links.
 * No Admin, Portal, or Sign in.
 */
export const SITE_FOOTER_NAV = buildFooterNav([
  {
    heading: "Products",
    links: [
      { href: "/products", label: "All Products" },
      { href: "/solutions", label: "Solutions" },
      { href: "/clients", label: "Clients" },
      { href: PRODUCT_SUITE.planner.routes.landing, label: "Planner" },
      { href: PRODUCT_SUITE.planner.routes.help, label: "Planner help" },
      { href: PRODUCT_SUITE.shared.routes.dashboard, label: "Member dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/trusted-by", label: "Trusted By" },
      { href: "/sustainability", label: "Sustainability" },
      { href: "/showrooms", label: "Showrooms" },
    ],
  },
  {
    heading: "Services",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/service", label: "After Sales" },
      { href: "/downloads", label: "Downloads" },
    ],
  },
]);

export const SITE_SOCIAL_LINKS = SITE_CONTACT.socialLinks;
