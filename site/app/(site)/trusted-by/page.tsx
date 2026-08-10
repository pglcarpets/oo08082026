import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { TrustedByPageView } from "@/components/trusted-by/TrustedByPageView";
import { TRUSTED_BY_CLIENTS } from "@/features/site/data/proof";
import { TRUSTED_BY_PAGE_COPY } from "@/features/site/data/routeCopy";
import { TRUSTED_BY_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = TRUSTED_BY_PAGE_METADATA;

/**
 * Abstract trust page — stats, palette swatches, quotes. No logo/badge wall.
 */
export default function TrustedByPage() {
  const sectors = Array.from(new Set(TRUSTED_BY_CLIENTS.map((client) => client.sector)));

  const trustedByJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/trusted-by",
    title: `${TRUSTED_BY_PAGE_COPY.heroTitle} | One&Only`,
    description: TRUSTED_BY_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Trusted by", path: "/trusted-by" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(trustedByJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <TrustedByPageView
        heroKicker={TRUSTED_BY_PAGE_COPY.heroKicker}
        heroTitleLead={TRUSTED_BY_PAGE_COPY.heroTitleLead}
        heroTitleAccent={TRUSTED_BY_PAGE_COPY.heroTitleAccent}
        heroSubtitle={TRUSTED_BY_PAGE_COPY.heroSubtitle}
        overviewKicker={TRUSTED_BY_PAGE_COPY.overviewKicker}
        overviewTitle={TRUSTED_BY_PAGE_COPY.overviewTitle}
        overviewDescription={TRUSTED_BY_PAGE_COPY.overviewDescription}
        statsKicker={TRUSTED_BY_PAGE_COPY.statsKicker}
        craftQuote={TRUSTED_BY_PAGE_COPY.craftQuote}
        craftAttribution={TRUSTED_BY_PAGE_COPY.craftAttribution}
        paletteKicker={TRUSTED_BY_PAGE_COPY.paletteKicker}
        paletteTitle={TRUSTED_BY_PAGE_COPY.paletteTitle}
        paletteDescription={TRUSTED_BY_PAGE_COPY.paletteDescription}
        quotesKicker={TRUSTED_BY_PAGE_COPY.quotesKicker}
        quotesTitle={TRUSTED_BY_PAGE_COPY.quotesTitle}
        quotes={TRUSTED_BY_PAGE_COPY.quotes}
        sectors={sectors}
        sectorsKicker={TRUSTED_BY_PAGE_COPY.sectorsKicker}
        sectorsTitle={TRUSTED_BY_PAGE_COPY.sectorsTitle}
        sectorsDescription={TRUSTED_BY_PAGE_COPY.sectorsDescription}
        ctaKicker={TRUSTED_BY_PAGE_COPY.ctaKicker}
        ctaTitleLead={TRUSTED_BY_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={TRUSTED_BY_PAGE_COPY.ctaTitleAccent}
        ctaDescription={TRUSTED_BY_PAGE_COPY.ctaDescription}
        ctaPrimary={TRUSTED_BY_PAGE_COPY.ctaPrimary}
        ctaSecondary={TRUSTED_BY_PAGE_COPY.ctaSecondary}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
