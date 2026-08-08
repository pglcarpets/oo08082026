export type HeroCarouselSlide = {
  src: string;
  location: string;
  headline: string;
  sub: string;
  ctas: Array<{
    label: string;
    href: string;
    variant: "primary" | "secondary";
  }>;
};

/**
 * Legacy hero carousel slides. Live homepage uses `HOMEPAGE_HERO_IMAGES` +
 * `HOMEPAGE_HERO_CONTENT` in `homepage.ts` instead.
 */
export const HERO_CAROUSEL_SLIDES: HeroCarouselSlide[] = [
  {
    src: "/assets/marketing/hero/slides/Titan-Oneandonly-bright.webp",
    location: "Titan Patna",
    headline: "Titan Patna\nCollaborative Office Design",
    sub: "Premium seating, meeting, and planning systems tailored for Titan's day-to-day collaboration and leadership workflows.",
    ctas: [
      {
        label: "View products",
        href: "/products",
        variant: "primary",
      },
      {
        label: "Get a quote",
        href: "/contact",
        variant: "secondary",
      },
    ],
  },
  {
    src: "/assets/marketing/hero/slides/TVS-Oneandonly-bright.webp",
    location: "TVS Patna",
    headline: "TVS Patna\nEngineered Workspaces",
    sub: "High-performance workstation planning delivered for TVS teams in Patna with ergonomic execution at enterprise scale.",
    ctas: [
      {
        label: "View products",
        href: "/products",
        variant: "primary",
      },
      {
        label: "Get a quote",
        href: "/contact",
        variant: "secondary",
      },
    ],
  },
];
