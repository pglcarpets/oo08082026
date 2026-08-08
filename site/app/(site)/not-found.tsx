import type { Metadata } from "next";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Page Not Found (404) | One&Only",
  description:
    "The page you were looking for could not be found. Browse our office furniture catalog, workspace planner, or contact our team for help.",
  path: "/404",
  alternates: false,
  indexable: false,
});

const POPULAR_LINKS = [
  { href: "/", label: "Homepage" },
  { href: "/products", label: "Product catalog" },
  { href: "/planner", label: "Workspace planner" },
  { href: "/solutions", label: "Workspace solutions" },
  { href: "/contact", label: "Contact sales" },
  { href: "/downloads", label: "Resource desk" },
] as const;

export default function NotFound() {
  return (
    <HomeMarketingLayout>
      <HomeSection variant="white" spacing="md">
        <HomeSectionInner>
          <div className="site-error flex min-h-[70vh] flex-col items-center justify-center text-center">
            <p className="typ-label text-body mb-4">Error 404</p>
            <h1 className="home-heading text-strong mb-4">
              We could not find that page
            </h1>
            <p className="page-copy text-body mx-auto mb-10 max-w-xl">
              The page may have moved, been renamed, or no longer exists. Use the links
              below to get back on track, or contact our team for direct help.
            </p>
            <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
              <MarketingCtaLink
                href="/"
                label="Go to homepage"
                surface="not-found"
                variant="primary"
              >
                Go to homepage
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/products"
                label="Browse products"
                surface="not-found"
                variant="outline"
              >
                Browse products
              </MarketingCtaLink>
            </div>
            <nav aria-label="Popular pages" className="flex flex-wrap items-center justify-center gap-3">
              {POPULAR_LINKS.map((link) => (
                <MarketingCtaLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  surface="not-found-popular"
                  variant="outline"
                >
                  {link.label}
                </MarketingCtaLink>
              ))}
            </nav>
          </div>
        </HomeSectionInner>
      </HomeSection>
    </HomeMarketingLayout>
  );
}
