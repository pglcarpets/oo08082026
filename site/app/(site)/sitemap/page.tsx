import type { Metadata } from "next";

import { HomeMarketingLayout } from "@/components/home/layout";
import { SitemapPageView } from "@/components/sitemap/SitemapPageView";
import { buildSitemapSections } from "@/features/site/data/htmlSitemap";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Sitemap | One&Only office furniture routes",
  description:
    "HTML sitemap of public One&Only pages — products, solutions, planning, service, planner, and company routes.",
  path: "/sitemap",
  keywords: ["sitemap", "One&Only pages", "office furniture site map"],
});

export default function HtmlSitemapPage() {
  const sections = buildSitemapSections();

  return (
    <HomeMarketingLayout>
      <SitemapPageView
        kicker="Site index"
        title="Sitemap"
        subtitle="Public routes for products, planning, planner, company, legal, and admin pages."
        sections={sections}
      />
    </HomeMarketingLayout>
  );
}
