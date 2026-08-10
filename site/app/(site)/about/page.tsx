import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AboutPageView } from "@/components/about/AboutPageView";
import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { ABOUT_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

/** Canonical SEO for /about (title length, description, OG, Twitter, canonical, hreflang). */
export const metadata: Metadata = ABOUT_PAGE_METADATA;

type AboutPillar = { title: string; detail: string };
type AboutProcessStep = { title: string; detail: string };

/**
 * Editorial about page — executed interiors, craft trust, bronze punctuation bands.
 * Benchmark: premium B2B interior editorial (Vitra / Muuto restraint), not template SaaS grids.
 */
export default async function AboutPage() {
  const t = await getTranslations("about");
  const pillars = t.raw("modelPillars") as AboutPillar[];
  const processSteps = t.raw("processSteps") as AboutProcessStep[];

  const aboutJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/about",
    title: "About One&Only | One and Only Furniture India — Steelcase & Featherlite",
    description: t("heroSubtitle"),
    pageType: "WebPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <AboutPageView
        heroKicker={t("heroKicker")}
        heroTitleLead={t("heroTitleLead")}
        heroTitleAccent={t("heroTitleAccent")}
        heroSubtitle={t("heroSubtitle")}
        heroCta={t("heroCta")}
        storyKicker={t("storyKicker")}
        storyTitleLead={t("storyTitleLead")}
        storyTitleAccent={t("storyTitleAccent")}
        storyLead={t("storyLead")}
        craftQuote={t("craftQuote")}
        craftAttribution={t("craftAttribution")}
        pillarsKicker={t("pillarsKicker")}
        pillars={pillars}
        processKicker={t("processKicker")}
        processTitleLead={t("processTitleLead")}
        processTitleAccent={t("processTitleAccent")}
        processSteps={processSteps}
        ctaKicker={t("ctaKicker")}
        ctaTitleLead={t("ctaTitleLead")}
        ctaTitleAccent={t("ctaTitleAccent")}
        ctaDescription={t("ctaDescription")}
        ctaPrimary={t("ctaPrimary")}
        ctaSecondary={t("ctaSecondary")}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
