import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ServicePageView } from "@/components/service/ServicePageView";
import {
  SERVICE_PAGE_CHANNELS,
  SERVICE_PAGE_COPY,
  SERVICE_PAGE_PILLARS,
} from "@/features/site/data/routeCopy";
import { SERVICE_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SERVICE_PAGE_METADATA;

export default function ServicePage() {
  const serviceJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/service",
    title: `${SERVICE_PAGE_COPY.heroTitle} | One&Only`,
    description: SERVICE_PAGE_COPY.heroSubtitle,
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Service", path: "/service" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <ServicePageView
        heroKicker={SERVICE_PAGE_COPY.heroKicker}
        heroTitleLead={SERVICE_PAGE_COPY.heroTitleLead}
        heroTitleAccent={SERVICE_PAGE_COPY.heroTitleAccent}
        heroSubtitle={SERVICE_PAGE_COPY.heroSubtitle}
        craftQuote={SERVICE_PAGE_COPY.craftQuote}
        craftAttribution={SERVICE_PAGE_COPY.craftAttribution}
        frameworkKicker={SERVICE_PAGE_COPY.frameworkKicker}
        frameworkTitle={SERVICE_PAGE_COPY.frameworkTitle}
        pillars={SERVICE_PAGE_PILLARS}
        channelsKicker={SERVICE_PAGE_COPY.channelsKicker}
        channelsTitle={SERVICE_PAGE_COPY.channelsTitle}
        channels={SERVICE_PAGE_CHANNELS}
        supportKicker={SERVICE_PAGE_COPY.supportKicker}
        supportDescription={SERVICE_PAGE_COPY.supportDescription}
        primaryCta={SERVICE_PAGE_COPY.primaryCta}
        secondaryCta={SERVICE_PAGE_COPY.secondaryCta}
        tertiaryCta={SERVICE_PAGE_COPY.tertiaryCta}
        ctaKicker={SERVICE_PAGE_COPY.ctaKicker}
        ctaTitleLead={SERVICE_PAGE_COPY.ctaTitleLead}
        ctaTitleAccent={SERVICE_PAGE_COPY.ctaTitleAccent}
        ctaDescription={SERVICE_PAGE_COPY.ctaDescription}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
