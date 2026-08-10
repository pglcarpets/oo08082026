import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SustainabilityPageView } from "@/components/sustainability/SustainabilityPageView";
import { SUSTAINABILITY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { SUSTAINABILITY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SUSTAINABILITY_PAGE_METADATA;

/**
 * Editorial sustainability — photography-forward hero, bronze punctuation, pillar rows.
 */
export default function SustainabilityPage() {
  const sustainabilityJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/sustainability",
    title: "Sustainable office furniture | One&Only",
    description: SUSTAINABILITY_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Sustainability", path: "/sustainability" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(sustainabilityJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <SustainabilityPageView
        heroKicker={SUSTAINABILITY_PAGE_COPY.heroKicker}
        heroTitleLead={SUSTAINABILITY_PAGE_COPY.heroTitleLead}
        heroTitleAccent={SUSTAINABILITY_PAGE_COPY.heroTitleAccent}
        heroSubtitle={SUSTAINABILITY_PAGE_COPY.heroSubtitle}
        heroCta={SUSTAINABILITY_PAGE_COPY.heroCta}
        craftQuote={SUSTAINABILITY_PAGE_COPY.craftQuote}
        craftAttribution={SUSTAINABILITY_PAGE_COPY.craftAttribution}
        commitmentsKicker={SUSTAINABILITY_PAGE_COPY.commitmentsKicker}
        commitmentsTitle={SUSTAINABILITY_PAGE_COPY.commitmentsTitle}
        commitments={SUSTAINABILITY_PAGE_COPY.commitments}
        introKicker={SUSTAINABILITY_PAGE_COPY.introKicker}
        introTitleLeadShort={SUSTAINABILITY_PAGE_COPY.introTitleLeadShort}
        introTitleAccent={SUSTAINABILITY_PAGE_COPY.introTitleAccent}
        introDescription={SUSTAINABILITY_PAGE_COPY.introDescription}
        introPoints={SUSTAINABILITY_PAGE_COPY.introPoints}
        ecoScoreTitle={SUSTAINABILITY_PAGE_COPY.ecoScoreTitle}
        ecoScoreDescription={SUSTAINABILITY_PAGE_COPY.ecoScoreDescription}
        ecoScoreItems={SUSTAINABILITY_PAGE_COPY.ecoScoreItems}
        ctaKicker={SUSTAINABILITY_PAGE_COPY.ctaKicker}
        ctaTitleLead={SUSTAINABILITY_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={SUSTAINABILITY_PAGE_COPY.ctaTitleAccent}
        ctaDescription={SUSTAINABILITY_PAGE_COPY.ctaDescription}
        ctaPrimary={SUSTAINABILITY_PAGE_COPY.ctaPrimary}
        ctaSecondary={SUSTAINABILITY_PAGE_COPY.ctaSecondary}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
