import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { HomeMarketingLayout } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { SolutionsCategoryPageView } from "@/components/solutions/SolutionsCategoryPageView";
import {
  SOLUTION_CATEGORY_IDS,
  type SolutionCategoryId,
} from "@/features/site/data/routeClassification";
import { SOLUTION_CATEGORY_DETAILS } from "@/features/site/data/solutionsPage";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";

/** Unknown slugs must hard-404 (no soft marketing shell). */
export const dynamicParams = false;

function isSolutionCategoryId(value: string): value is SolutionCategoryId {
  return (SOLUTION_CATEGORY_IDS as readonly string[]).includes(value);
}

type SolutionsParams = Promise<{ category: string }>;

function getSolutionEntry(category: string) {
  if (!isSolutionCategoryId(category)) {
    return undefined;
  }
  return SOLUTION_CATEGORY_DETAILS[category];
}

export function generateStaticParams() {
  return SOLUTION_CATEGORY_IDS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: SolutionsParams;
}): Promise<Metadata> {
  const { category } = await params;
  const entry = getSolutionEntry(category);

  // Unknown slugs must not emit indexable generic Solutions metadata (soft-404 SEO risk).
  if (!entry) {
    notFound();
  }

  return buildPageMetadata(SITE_URL, {
    title: entry.title,
    description: `${entry.description} Built for offices in Patna, Bihar and across India.`,
    path: `/solutions/${category}`,
  });
}

/**
 * Solutions category detail — editorial hero, bronze craft strip, dark CTA band.
 * Mirrors hub premium pass; category photography from live catalog stills.
 */
export default async function SolutionsCategoryPage({
  params,
}: {
  params: SolutionsParams;
}) {
  const { category } = await params;
  const entry = getSolutionEntry(category);

  if (!entry) {
    notFound();
  }

  const t = await getTranslations("solutions");

  return (
    <HomeMarketingLayout>
      <SolutionsCategoryPageView
        categoryId={category}
        heroKicker={t("categoryHeroKicker")}
        heroTitleLead={entry.titleLead}
        heroTitleAccent={entry.titleAccent}
        heroSubtitle={entry.description}
        heroPrimaryCta={t("categoryHeroPrimaryCta")}
        heroSecondaryCta={t("categoryHeroSecondaryCta")}
        heroImage={entry.image}
        heroImageAlt={entry.imageAlt}
        productsHref={entry.productsHref}
        craftQuote={t("categoryCraftQuote")}
        craftAttribution={t("categoryCraftAttribution")}
        bodyKicker={t("categoryBodyKicker")}
        bodyTitle={t("categoryBodyTitle")}
        bodyDescription={t("categoryBodyDescription", {
          description: entry.description,
        })}
        browseCta={t("categoryBrowseCta")}
        allSolutionsCta={t("categoryAllCta")}
        contactCta={t("categoryContactCta")}
        deskKicker={t("categoryDeskKicker")}
        deskTitle={t("categoryDeskTitle")}
        deskDescription={t("categoryDeskDescription")}
        deskPrimaryCta={t("categoryDeskPrimaryCta")}
        deskSecondaryCta={t("categoryDeskSecondaryCta")}
        deskTertiaryCta={t("categoryDeskTertiaryCta")}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
