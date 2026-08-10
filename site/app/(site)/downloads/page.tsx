import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { DownloadsPageView } from "@/components/downloads/DownloadsPageView";
import { DOWNLOADS_PAGE_COPY, DOWNLOADS_RESOURCE_CATEGORIES } from "@/features/site/data/routeCopy";
import { DOWNLOADS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = DOWNLOADS_PAGE_METADATA;

export default function DownloadsPage() {
  const downloadsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/downloads",
    title: `${DOWNLOADS_PAGE_COPY.heroTitle} | One&Only`,
    description: DOWNLOADS_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Downloads", path: "/downloads" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(downloadsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <DownloadsPageView
        heroKicker={DOWNLOADS_PAGE_COPY.heroKicker}
        heroTitleLead={DOWNLOADS_PAGE_COPY.heroTitleLead}
        heroTitleAccent={DOWNLOADS_PAGE_COPY.heroTitleAccent}
        heroSubtitle={DOWNLOADS_PAGE_COPY.heroSubtitle}
        heroPrimaryCta={DOWNLOADS_PAGE_COPY.heroPrimaryCta}
        resourceKicker={DOWNLOADS_PAGE_COPY.resourceKicker}
        resourceTitle={DOWNLOADS_PAGE_COPY.resourceTitle}
        resourceDescription={DOWNLOADS_PAGE_COPY.resourceDescription}
        resources={DOWNLOADS_RESOURCE_CATEGORIES}
        processKicker={DOWNLOADS_PAGE_COPY.processKicker}
        processTitle={DOWNLOADS_PAGE_COPY.processTitle}
        processSteps={DOWNLOADS_PAGE_COPY.processSteps}
        noteTitle={DOWNLOADS_PAGE_COPY.noteTitle}
        noteBody={DOWNLOADS_PAGE_COPY.noteBody}
        notePoints={DOWNLOADS_PAGE_COPY.notePoints}
        urgentKicker={DOWNLOADS_PAGE_COPY.urgentKicker}
        urgentDescription={DOWNLOADS_PAGE_COPY.urgentDescription}
        primaryCta={DOWNLOADS_PAGE_COPY.primaryCta}
        secondaryCta={DOWNLOADS_PAGE_COPY.secondaryCta}
        tertiaryCta={DOWNLOADS_PAGE_COPY.tertiaryCta}
        ctaKicker={DOWNLOADS_PAGE_COPY.ctaKicker}
        ctaTitleLead={DOWNLOADS_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={DOWNLOADS_PAGE_COPY.ctaTitleAccent}
        ctaDescription={DOWNLOADS_PAGE_COPY.ctaDescription}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
