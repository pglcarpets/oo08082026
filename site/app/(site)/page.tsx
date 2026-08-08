import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
/* Homepage CSS loaded once via site/index.css → homepage/index.css (globals). */
import { HomepageHero } from "@/components/home/HomepageHero";
import { HomeMarketingLayout } from "@/components/home/layout";
import { Collections } from "@/components/home/Collections";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ShowcaseCarousel } from "@/components/home/ShowcaseCarousel";
import { InteractiveTools } from "@/components/home/InteractiveTools";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { ContactTeaser } from "@/components/shared/ContactTeaser";

import { SITE_BRAND } from "@/lib/analytics/seo";
import { buildPageJsonLd, buildPageMetadata } from "@/lib/analytics/seo";
import { buildLocalBusinessJsonLd } from "@/features/site/data/seo";
import { getBusinessStats } from "@/features/crm/businessStats";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: SITE_BRAND.defaultTitle,
  description: SITE_BRAND.description,
  path: "/",
});

export default async function Home() {
  const t = await getTranslations("home");
  const { stats } = await getBusinessStats();
  const homeJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/",
    title: SITE_BRAND.defaultTitle,
    description: SITE_BRAND.description,
    pageType: "WebPage",
  });
  const localBusinessJsonLd = buildLocalBusinessJsonLd(SITE_URL);

  const sectionLabel = t("showcase.sectionLabel");
  const sectionTitleLead = t("showcase.sectionTitleLead");
  const sectionTitleAccent = t("showcase.sectionTitleAccent");
  const showcaseItems = t.raw("showcase.items") as Array<{
    id: string;
    name: string;
    label: string;
    image: string;
    link: string;
  }>;

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(homeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(localBusinessJsonLd) }}
      />

      <HomepageHero />
      <div className="home-bronze-rule scheme-accent-wash" aria-hidden="true" />
      <Collections />
      <TrustStrip stats={stats} />
      <InteractiveTools />
      <WhyChooseUs />
      <ShowcaseCarousel
        sectionLabel={sectionLabel}
        sectionAriaLabel={`${sectionTitleLead} ${sectionTitleAccent}`}
        sectionTitle={
          <>
            {sectionTitleLead}{" "}
            <span className="text-accent-italic">
              {sectionTitleAccent}
            </span>
          </>
        }
        items={[...showcaseItems]}
        browseLink={t("showcase.browseCta.href")}
        browseLabel={t("showcase.browseCta.label")}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
