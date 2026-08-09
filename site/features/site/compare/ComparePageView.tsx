import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ComparePageHeader } from "@/components/compare/ComparePageHeader";
import { CompareColumnActions } from "@/components/products/CompareColumnActions";
import { CompareShortlistHydrator } from "@/components/products/CompareShortlistHydrator";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  HomeMarketingLayout,
  HomeSection,
  HomeSectionInner,
} from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { getProducts, type Product } from "@/lib/catalog/site/getProducts";
import {
  getCatalogCategoryLabel,
  normalizeRequestedCategoryId,
} from "@/lib/catalog/site/categories";
import {
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import { normalizeAssetPath, PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";
import { COMPARE_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { buildPageJsonLd } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const COMPARE_PAGE_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/compare",
  title:
    "Compare office furniture | One&Only",
  description: COMPARE_ROUTE_COPY.description,
  pageType: "WebPage",
});

type CompareItem = {
  productUrlKey: string;
  product: Product;
  categoryId: string;
};

function toText(value: unknown): string {
  if (typeof value === "string") {return value.trim();}
  if (typeof value === "number") {return String(value);}
  return "";
}

function toList(value: unknown): string[] {
  if (!Array.isArray(value)) {return [];}
  return value.map((item) => String(item).trim()).filter(Boolean);
}

function parseItemKeys(rawItems: string | string[] | undefined): string[] {
  const joined = Array.isArray(rawItems) ? rawItems.join(",") : rawItems || "";
  return Array.from(
    new Set(
      joined
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ).slice(0, 4);
}

function resolveCategoryId(product: Product): string {
  return normalizeRequestedCategoryId(product.category_id) || "products";
}

async function resolveCompareItems(keys: string[]): Promise<CompareItem[]> {
  if (keys.length === 0) {return [];}

  const requestedKeys = new Set(keys.map((key) => key.toLowerCase()));
  const products = await getProducts();
  const productsBySlug = new Map(
    products
      .map((product) => [String(product.slug || "").trim().toLowerCase(), product] as const)
      .filter(([slug]) => requestedKeys.has(slug)),
  );

  return keys
    .map((key) => {
      const product = productsBySlug.get(key.toLowerCase());
      if (!product) {return null;}
      const categoryId = resolveCategoryId(product);
      return { productUrlKey: key, product, categoryId } satisfies CompareItem;
    })
    .filter((item): item is CompareItem => Boolean(item));
}

function specValue(item: CompareItem, key: string): string {
  const metadata =
    item.product.metadata && typeof item.product.metadata === "object"
      ? (item.product.metadata as Record<string, unknown>)
      : {};
  const specs =
    item.product.specs && typeof item.product.specs === "object" && !Array.isArray(item.product.specs)
      ? (item.product.specs as Record<string, unknown>)
      : {};

  if (key === "category") {
    return getCatalogCategoryLabel(item.categoryId, item.categoryId);
  }
  if (key === "series") {
    return item.product.series_name || "";
  }
  if (key === "dimensions") {
    return filterMeaningfulDimensionText(
      toText(specs.dimensions) || toText(specs.dimension) || "",
    );
  }
  if (key === "materials") {
    const specMaterials = filterMeaningfulMaterialList(toList(specs.materials));
    const metadataMaterials = filterMeaningfulMaterialList(
      Array.isArray(metadata.material) ? metadata.material.map((m) => String(m)) : [],
    );
    const materials = specMaterials.length > 0 ? specMaterials : metadataMaterials;
    return materials.length > 0 ? materials.slice(0, 3).join(", ") : "";
  }
  if (key === "warranty") {
    const warrantyYears =
      typeof metadata.warrantyYears === "number" ? metadata.warrantyYears : null;
    return warrantyYears ? `${warrantyYears}-Year warranty` : "";
  }
  if (key === "certification") {
    const certifications = toList(specs.certifications);
    if (certifications.length > 0) {return certifications.slice(0, 3).join(", ");}
    return metadata.bifmaCertified ? "BIFMA certified" : "";
  }
  if (key === "sustainability") {
    const score =
      typeof metadata.sustainabilityScore === "number"
        ? metadata.sustainabilityScore
        : typeof specs.sustainability_score === "number"
          ? specs.sustainability_score
          : null;
    return typeof score === "number" ? `Eco score ${score}/10` : "";
  }
  if (key === "features") {
    const features = toList(specs.features);
    return features.length > 0 ? features.slice(0, 3).join(", ") : "";
  }
  return "-";
}

const QUICK_CATEGORIES = [
  { href: "/products/workstations", label: "Workstations" },
  { href: "/products/chairs", label: "Seating" },
  { href: "/products/tables", label: "Tables" },
  { href: "/products/storage", label: "Storage" },
] as const;

export async function ComparePageView({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const keys = parseItemKeys(resolvedSearchParams.items);
  const items = await resolveCompareItems(keys);

  const allCompareRows = [
    { key: "category", label: "Category" },
    { key: "series", label: "Series" },
    { key: "dimensions", label: "Dimensions" },
    { key: "materials", label: "Materials" },
    { key: "warranty", label: "Warranty" },
    { key: "certification", label: "Certification" },
    { key: "sustainability", label: "Sustainability" },
    { key: "features", label: "Key features" },
  ] as const;

  const compareRows = allCompareRows.filter(
    (row) =>
      row.key === "category" ||
      items.some((item) => specValue(item, row.key).trim().length > 0),
  );
  const firstItem = items[0];
  const backLabel = firstItem
    ? getCatalogCategoryLabel(firstItem.categoryId, firstItem.categoryId)
    : null;
  const backHref = firstItem ? `/products/${firstItem.categoryId}` : "/products";

  return (
    <HomeMarketingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(COMPARE_PAGE_JSON_LD),
        }}
      />
      <Suspense fallback={null}>
        <CompareShortlistHydrator />
      </Suspense>
      <div className="compare-page">
        <ComparePageHeader
          backHref={backHref}
          backLabel={backLabel ?? "Products"}
          itemCount={items.length}
        />


        <div className="compare-bronze-rule" aria-hidden="true">
          <div className="home-shell-xl" />
        </div>

        <section className="home-section home-section--white section-y" aria-labelledby="compare-body-heading">
          <div className="home-shell-xl">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
              <div>
                <h2 id="compare-body-heading" className="home-heading">
                  {COMPARE_ROUTE_COPY.bodyHeading}
                </h2>
                {items.length > 0 ? (
                  <p className="page-copy-sm mt-3 text-body">
                    {COMPARE_ROUTE_COPY.bodyPopulatedHint}
                  </p>
                ) : null}
              </div>
              {items.length > 0 ? (
                <span className="compare-count">
                  {COMPARE_ROUTE_COPY.countLabel.replace("{count}", String(items.length))}
                </span>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="compare-empty">
                <div>
                  <p className="typ-label text-contrast-accent">
                    {COMPARE_ROUTE_COPY.emptyShortlistKicker}
                  </p>
                  <p className="home-heading mt-3">
                    {COMPARE_ROUTE_COPY.emptyTitle}
                  </p>
                  <p className="page-copy-sm mt-5 max-w-2xl text-body">
                    {COMPARE_ROUTE_COPY.emptyDescription}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <MarketingCtaLink
                      href="/products"
                      label={COMPARE_ROUTE_COPY.emptyPrimaryCta}
                      surface="compare-page-empty"
                      variant="outline"
                    >
                      {COMPARE_ROUTE_COPY.emptyPrimaryCta}
                    </MarketingCtaLink>
                    <MarketingCtaLink
                      href="/downloads"
                      label={COMPARE_ROUTE_COPY.emptySecondaryCta}
                      surface="compare-page-empty"
                      variant="outline"
                    >
                      {COMPARE_ROUTE_COPY.emptySecondaryCta}
                    </MarketingCtaLink>
                    <MarketingCtaLink
                      href="/choose-product?mode=guest"
                      label={COMPARE_ROUTE_COPY.emptyPlannerCta}
                      surface="compare-page-empty"
                      variant="primary"
                    >
                      {COMPARE_ROUTE_COPY.emptyPlannerCta}
                    </MarketingCtaLink>
                  </div>
                  <nav className="mt-8" aria-label="Popular product categories">
                    <p className="typ-label text-contrast-accent mb-3">
                      {COMPARE_ROUTE_COPY.jumpCategoryLabel}
                    </p>
                    <ul className="compare-jump">
                      {QUICK_CATEGORIES.map((cat) => (
                        <li key={cat.href}>
                          <Link href={cat.href} className="compare-jump__link typ-body-sm">
                            {cat.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
                <ol className="compare-empty__steps">
                  {COMPARE_ROUTE_COPY.emptySteps.map((step, index) => (
                    <li key={step} className="compare-empty__step">
                      <span className="text-contrast-accent" aria-hidden="true">
                        0{index + 1}
                      </span>
                      <p className="page-copy-sm mt-3 text-body">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div className="compare-table-shell">
                <table className="compare-table">
                  <caption className="sr-only">{COMPARE_ROUTE_COPY.tableCaption}</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="compare-table__spec typ-cta">
                        {COMPARE_ROUTE_COPY.specColumnLabel}
                      </th>
                      {items.map((item) => {
                        const image =
                          normalizeAssetPath(item.product.images?.[0]) ||
                          normalizeAssetPath(item.product.flagship_image) ||
                          PRODUCT_IMAGE_FALLBACK;
                        const productHref = `/products/${item.categoryId}/${item.product.slug}`;
                        return (
                          <th key={item.product.id} scope="col">
                            <Link href={productHref} className="block">
                              <div className="compare-table__thumb">
                                <Image
                                  src={image}
                                  alt={item.product.name}
                                  fill
                                  sizes="(max-width: 1024px) 100vw, 33vw"
                                  className="object-cover"
                                />
                              </div>
                              <p className="typ-cta text-heading">{item.product.name}</p>
                            </Link>
                            <CompareColumnActions
                              productId={item.product.slug || item.product.id}
                              productName={item.product.name}
                              productHref={productHref}
                              image={image}
                              viewLabel={COMPARE_ROUTE_COPY.viewProductCta}
                              addLabel={COMPARE_ROUTE_COPY.addToQuoteCta}
                            />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {compareRows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" className="compare-table__spec typ-cta">
                          {row.label}
                        </th>
                        {items.map((item) => (
                          <td
                            key={`${item.product.id}-${row.key}`}
                            className="typ-body-sm text-body"
                          >
                            {specValue(item, row.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <HomeSection variant="soft" spacing="md" borderY>
          <HomeSectionInner>
            <RouteCtaBand
              kicker={COMPARE_ROUTE_COPY.ctaKicker}
              title={COMPARE_ROUTE_COPY.ctaTitle}
              description={COMPARE_ROUTE_COPY.ctaDescription}
              actions={[
                {
                  href: "/contact?intent=quote&source=compare",
                  label: COMPARE_ROUTE_COPY.primaryCta,
                  variant: "primary",
                },
                {
                  href: "/downloads",
                  label: COMPARE_ROUTE_COPY.resourceDeskCta,
                  variant: "outline-light",
                },
              ]}
            />
          </HomeSectionInner>
        </HomeSection>

        <ContactTeaser />
      </div>
    </HomeMarketingLayout>
  );
}
