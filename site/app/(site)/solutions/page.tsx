import { getTranslations } from "next-intl/server";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SolutionsPageView } from "@/components/solutions/SolutionsPageView";
import { SOLUTION_CATEGORIES } from "@/features/site/data/solutionsPage";
import { SOLUTIONS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = SOLUTIONS_PAGE_METADATA;

type DeliveryMedia = { src: string; alt: string };

/**
 * Solutions hub — editorial category grid, bronze punctuation, GSAP reveals.
 * Category detail: `/solutions/[category]` (premium pass 2026-07-23).
 */
export default async function SolutionsPage() {
  const t = await getTranslations("solutions");
  const deliveryMedia = t.raw("deliveryMedia") as DeliveryMedia;

  return (
    <HomeMarketingLayout>
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
