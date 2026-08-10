import { getTranslations } from "next-intl/server";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SolutionsPageView } from "@/components/solutions/SolutionsPageView";
import { SOLUTION_CATEGORIES } from "@/features/site/data/solutionsPage";
import { SOLUTIONS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { buildBreadcrumbJsonLd, buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata = SOLUTIONS_PAGE_METADATA;

type DeliveryMedia = { src: string; alt: string };

/**
 * Solutions hub — editorial category grid, bronze punctuation, GSAP reveals.
 * Category detail: `/solutions/[category]` (premium pass 2026-07-23).
 */
export default async function SolutionsPage() {
  const t = await getTranslations("solutions");
  const deliveryMedia = t.raw("deliveryMedia") as DeliveryMedia;

  const solutionsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/solutions",
    title: `${t("heroTitleLead")} ${t("heroTitleAccent")}`,
    description: t("heroSubtitle"),
    pageType: "CollectionPage",
  });
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(SITE_URL, [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/solutions" },
  ]);

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(solutionsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(breadcrumbJsonLd) }}
      />
      <SolutionsPageView
        heroKicker={t("heroKicker")}
        heroTitleLead={t("heroTitleLead")}
        heroTitleAccent={t("heroTitleAccent")}
        heroSubtitle={t("heroSubtitle")}
        heroPrimaryCta={t("heroPrimaryCta")}
        heroSecondaryCta={t("heroSecondaryCta")}
        deliveryKicker={t("deliveryKicker")}
        deliveryTitle={t("deliveryTitle")}
        deliveryDescription={t("deliveryDescription")}
        deliveryMedia={deliveryMedia}
        categoriesTitleLead={t("categoriesTitleLead")}
        categoriesTitleAccent={t("categoriesTitleAccent")}
        categories={SOLUTION_CATEGORIES}
        planningKicker={t("planningKicker")}
        planningTitle={t("planningTitle")}
        planningDescription={t("planningDescription")}
        planningPrimaryCta={t("planningPrimaryCta")}
        planningSecondaryCta={t("planningSecondaryCta")}
        planningTertiaryCta={t("planningTertiaryCta")}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
