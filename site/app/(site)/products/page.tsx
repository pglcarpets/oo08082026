import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { loadProductsCategoryTiles } from "@/components/home/CategoryGrid";
import { HomeMarketingLayout } from "@/components/home/layout";
import { ProductsPageView, type ProductPillar } from "@/components/products/ProductsPageView";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { PRODUCTS_HERO_IMAGE } from "@/features/site/data/productsPage";
import { buildPageJsonLd, buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

/**
 * Products hub — editorial category grid, bronze punctuation, GSAP reveals.
 * Category listing: `/products/[category]` · PDP: `/products/[category]/[product]`.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products");
  const title = `${t("headlineLead")} ${t("headlineAccent")}`;
  return buildPageMetadata(SITE_URL, {
    title,
    description: t("heroSubtitle"),
    path: "/products",
    image: PRODUCTS_HERO_IMAGE.src,
  });
}

export default async function ProductsPage() {
  const t = await getTranslations("products");
  const headlineLead = t("headlineLead");
  const headlineAccent = t("headlineAccent");
  const title = `${headlineLead} ${headlineAccent}`;
  const pillars = t.raw("pillars") as ProductPillar[];
  const categories = await loadProductsCategoryTiles((categoryId, fallback) => {
    const key = `categories.${categoryId}`;
    return t.has(key) ? t(key) : fallback;
  });

  const productsJsonLd = buildPageJsonLd(SITE_URL, {
    path: "/products",
    title,
    description: t("heroSubtitle"),
    pageType: "CollectionPage",
  });

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonForScript(productsJsonLd) }}
      />

      <ProductsPageView
        heroKicker={t("heroKicker")}
        heroTitleLead={headlineLead}
        heroTitleAccent={headlineAccent}
        heroSubtitle={t("heroSubtitle")}
        heroPrimaryCta={t("heroPrimaryCta")}
        heroSecondaryCta={t("heroSecondaryCta")}
        craftQuote={t("craftQuote")}
        craftAttribution={t("craftAttribution")}
        introKicker={t("introKicker")}
        introTitleLead={t("introTitleLead")}
        introTitleAccent={t("introTitleAccent")}
        introDescription={t("introDescription")}
        featureBullets={t.raw("featureBullets") as string[]}
        categoryRoutesKicker={t("categoryRoutesKicker")}
        categoryRoutesDescription={t("categoryRoutesDescription")}
        categoryRoutesCta={t("categoryRoutesCta")}
        rangeKicker={t("rangeKicker")}
        rangeTitleLead={t("rangeTitleLead")}
        rangeTitleAccent={t("rangeTitleAccent")}
        pillarsKicker={t("pillarsKicker")}
        pillarsTitleLead={t("pillarsTitleLead")}
        pillarsTitleAccent={t("pillarsTitleAccent")}
        pillarsIntro={t("pillarsIntro")}
        pillars={pillars}
        categories={categories}
        deskKicker={t("deskKicker")}
        deskTitle={t("deskTitle")}
        deskDescription={t("deskDescription")}
        deskPrimaryCta={t("deskPrimaryCta")}
        deskSecondaryCta={t("deskSecondaryCta")}
        deskTertiaryCta={t("deskTertiaryCta")}
      />
      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
