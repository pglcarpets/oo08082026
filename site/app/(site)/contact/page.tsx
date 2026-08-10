import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContactPageView } from "@/components/contact/ContactPageView";
import { HomeMarketingLayout } from "@/components/home/layout";
import { CONTACT_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

/** Canonical SEO for /contact (title length, locales, brands, OG). */
export const metadata: Metadata = CONTACT_PAGE_METADATA;

type ContactOffice = { title: string; lines: string[] };

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return value || null;
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("contact");
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const intent = firstValue(resolvedSearchParams.intent);
  const source = firstValue(resolvedSearchParams.source);
  const offices = t.raw("offices") as ContactOffice[];

  const contactJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/contact",
    title: "Contact office furniture sales | India | One&Only",
    description: t("heroSubtitle"),
    pageType: "ContactPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(contactJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <ContactPageView
        intent={intent}
        source={source}
        heroKicker={t("heroKicker")}
        heroTitleLead={t("heroTitleLead")}
        heroTitleAccent={t("heroTitleAccent")}
        heroSubtitle={t("heroSubtitle")}
        sectionTitle={t("sectionTitle")}
        introTitle={t("introTitle")}
        resourceDeskLead={t("resourceDeskLead")}
        resourceDeskCta={t("resourceDeskCta")}
        resourceDeskTail={t("resourceDeskTail")}
        quickDeskKicker={t("quickDeskKicker")}
        quickDeskTitle={t("quickDeskTitle")}
        quickDeskDescription={t("quickDeskDescription")}
        quickDeskPrimaryCta={t("quickDeskPrimaryCta")}
        quickDeskSecondaryCta={t("quickDeskSecondaryCta")}
        channelRegionLabel={t("channelRegionLabel")}
        channelQuotesLabel={t("channelQuotesLabel")}
        channelSupportLabel={t("channelSupportLabel")}
        channelEmailLabel={t("channelEmailLabel")}
        channelsAriaLabel={t("channelsAriaLabel")}
        offices={offices}
      />
    </HomeMarketingLayout>
  );
}
