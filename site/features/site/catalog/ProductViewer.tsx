"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type {
  CompatProduct as Product,
  ProductVariant,
} from '@/lib/catalog/site/getProducts';
import { ArrowLeft, CaretRight as ChevronRight, ShareNetwork as Share2, ShoppingCart, GitDiff as GitCompareArrows } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import { PlannerLaunchLink } from "@/components/ui/PlannerLaunchLink";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { Reviews } from "@/components/Reviews";
import { ProductGallery } from "@/components/ProductGallery";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { useQuoteCart } from "@/lib/store/quoteCart";
import { useProductCompare } from "@/lib/store/productCompare";
import { CompareDock } from "@/components/products/CompareDock";
import { HomeMarketingLayout } from "@/components/home/layout";
import {
  createAnonymousUserId,
  normalizeAnonymousUserId,
} from "@/lib/tracking/anonymousUserId";
import {
  sanitizeDisplayText as normalizeDisplayText,
  filterMeaningfulDimensionText,
  filterMeaningfulMaterialList,
} from "@/lib/displayText";
import {
  buildFilterParams,
  parseFiltersFromSearchParams,
} from '@/lib/catalog/site/filters';
import {
  trackCompareToggled,
  trackQuoteCartAdded,
} from "@/lib/analytics/siteEvents";
import { GUEST_PLANNER_WORKSPACE_HREF } from "@/lib/analytics/plannerEntry";
import { PDP_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { InlinePlanSymbolPreview } from "@/features/site/catalog/InlinePlanSymbolPreview";
import { preferMarketingImages } from "@/lib/catalog/site/marketingImages";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

interface ProductViewerProps {
  product: Product;
  categoryRoute: string;
  categoryId?: string;
  categoryName: string;
  productRoute: string;
  /**
   * Published plan-symbol SVG when disk `/svg-catalog/{slug}.svg` or revision URL exists.
   * Optional continuity thumb next to marketing gallery (S8).
   *
   * **Phase 7 Stage A — labelled legacy `/svg-catalog` read fallback.** Marketing
   * thumb only; the planner paints the PNG plan symbol, never this URL.
   */
  planSvgThumbUrl?: string | null;
}

export function sanitizeDisplayText(value: string): string {
  return String(value || "")
    .replace(/[\uFFFD]+/g, "")
    .replace(/â€”/g, "—")
    .replace(/â€“/g, "–")
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€\u009d|â€"/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtmlAttribute(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function sanitizeDisplayList(values: string[]): string[] {
  return values.map((item) => normalizeDisplayText(item)).filter(Boolean);
}

export function ProductViewer({
  product,
  categoryRoute,
  categoryId,
  categoryName,
  productRoute,
  planSvgThumbUrl = null,
}: ProductViewerProps) {
  const rootRef = useRef<HTMLElement>(null);
  const addItem = useQuoteCart((state) => state.addItem);
  const compareItems = useProductCompare((state) => state.items);
  const toggleCompareItem = useProductCompare((state) => state.toggleItem);
  const searchParams = useSearchParams();
  const pathname = usePathname() || "";
  const cleanName = (raw: string) => {
    if (!raw) {return raw;}
    const m = raw.match(/^([A-Z][a-z]+(?:[- ][A-Z][a-z0-9]*)?)\1/);
    if (m && m[1]) {return m[1];}
    if (raw.length > 30 && !raw.includes(" ")) {
      const cap = raw.match(/^[A-Z][a-z]+/);
      if (cap) {return cap[0];}
    }
    return raw;
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : null,
  );
  const displayName = cleanName(normalizeDisplayText(product.name));

  const allImages = [
    ...(product.images || []),
    product.flagshipImage,
    ...(selectedVariant?.galleryImages || []),
    ...(product.sceneImages || []),
  ].filter(Boolean) as string[];

  const uniqueImages = preferMarketingImages(allImages);
  const metadataRecord = product.metadata as Record<string, unknown> | undefined;

  useEffect(() => {
    // Basic anonymous tracking for recommendations
    let userId = normalizeAnonymousUserId(localStorage.getItem("oando_user_id"));
    if (!userId) {
      userId = createAnonymousUserId();
      localStorage.setItem("oando_user_id", userId);
    }

    fetch("/api/tracking/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, productId: product.id }),
    }).catch(console.error);
  }, [product.id]);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !rootRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const heroTargets = rootRef.current?.querySelectorAll("[data-pdp-reveal]");
        if (heroTargets?.length) {
          gsap.from(heroTargets, {
            y: GSAP_REVEAL.y,
            opacity: GSAP_REVEAL.opacity,
            duration: GSAP_REVEAL.duration,
            stagger: GSAP_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
          });
        }

        const scrollTargets = rootRef.current?.querySelectorAll(
          "[data-pdp-scroll-reveal]",
        );
        if (scrollTargets?.length) {
          gsap.from(scrollTargets, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: scrollTargets[0],
              start: "top 90%",
              once: true,
            },
          });
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef, dependencies: [product.id, planSvgThumbUrl] },
  );

  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // When variants change, uniqueImages will update which resets the ProductGallery index implicitly
  };

  const toText = (value: unknown): string => {
    if (typeof value === "string") {return normalizeDisplayText(value);}
    if (typeof value === "number") {return String(value);}
    return "";
  };
  const toStringList = (value: unknown): string[] => {
    if (!Array.isArray(value)) {return [];}
    return sanitizeDisplayList(value.map((item) => String(item)));
  };
  const routeKey = (product.slug || product.id || "").trim();
  const compareId = `compare-${categoryId || "products"}-${routeKey}`;
  const inCompare = compareItems.some((item) => item.id === compareId);
  const rawFrom = searchParams.get("from");
  const normalizedFrom = rawFrom?.trim().replace(/^\?/, "").slice(0, 1500) || "";
  const parsedFrom = normalizedFrom
    ? buildFilterParams(
        parseFiltersFromSearchParams(new URLSearchParams(normalizedFrom)),
      ).toString()
    : "";
  const encodedFrom = parsedFrom ? encodeURIComponent(parsedFrom) : "";
  const categoryRouteWithContext = parsedFrom
    ? `${categoryRoute}?${parsedFrom}`
    : categoryRoute;
  const productRouteWithContext = encodedFrom
    ? `${productRoute}?from=${encodedFrom}`
    : productRoute;

  const rawSpecs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};

  const overview = normalizeDisplayText(
    product.detailedInfo?.overview || product.description || "",
  );
  const dimensions = filterMeaningfulDimensionText(
    toText(rawSpecs.dimensions) ||
      toText(rawSpecs.dimension) ||
      product.detailedInfo?.dimensions ||
      "",
  );
  const specMaterials = filterMeaningfulMaterialList(toStringList(rawSpecs.materials));
  const finishOptions = toStringList(rawSpecs.finish_options);
  const primaryMaterials = filterMeaningfulMaterialList(
    sanitizeDisplayList(product.detailedInfo?.materials?.filter(Boolean) || []),
  );
  const materials =
    specMaterials.length > 0
      ? specMaterials
      : primaryMaterials.length > 0
        ? primaryMaterials
        : [];
  const features = sanitizeDisplayList(
    product.detailedInfo?.features?.filter(
      (f: string) => f && f !== "MANUFACTURING" && f !== "Sustainability",
    ) || [],
  );
  const useCases = sanitizeDisplayList(
    Array.isArray(product.metadata?.useCase)
      ? product.metadata.useCase
      : toStringList(rawSpecs.use_case),
  );
  const warrantyYears = product.metadata?.warrantyYears;
  const warrantyRaw = toText(rawSpecs.warranty_text);
  const warrantyText = warrantyYears
    ? `${warrantyYears}-Year Warranty`
    : warrantyRaw;
  const certifications = sanitizeDisplayList([
    ...toStringList(rawSpecs.certifications),
    ...toStringList(metadataRecord?.certifications),
    ...(product.metadata?.bifmaCertified ? ["BIFMA Certified"] : []),
  ]);
  const certificationText = certifications.join(", ");
  const sustainabilityText =
    typeof product.metadata?.sustainabilityScore === "number"
      ? `Eco Score ${product.metadata.sustainabilityScore}/10`
      : toText(rawSpecs.sustainability_text);
  const quickConfig =
    toText(rawSpecs.configuration) ||
    toText(rawSpecs.type);
  const shortOverview = (() => {
    if (!overview) {return "";}
    const clean = overview.replace(/\s+/g, " ").trim();
    const sentenceMatch = clean.match(/^[^.!?]+[.!?]\s*[^.!?]*[.!?]?/);
    if (sentenceMatch?.[0]) {return sentenceMatch[0].trim();}
    return clean.length > 180 ? `${clean.slice(0, 180).trim()}...` : clean;
  })();
  const fullOverview =
    overview && shortOverview && overview !== shortOverview ? overview : "";
  const specRows = [
    { label: "Dimensions", value: dimensions },
    ...(materials.length > 0
      ? [
          {
            label: "Materials",
            value: materials.slice(0, 3).join(", "),
          },
        ]
      : []),
    ...(finishOptions.length > 0
      ? [
          {
            label: "Finish Options",
            value: finishOptions.slice(0, 3).join(", "),
          },
        ]
      : []),
    { label: "Warranty", value: warrantyText },
    { label: "Certification", value: certificationText },
    { label: "Configuration", value: quickConfig },
    {
      label: "Use Case",
      value: useCases.length > 0 ? useCases.slice(0, 3).join(", ") : "",
    },
    { label: "Sustainability", value: sustainabilityText },
  ].filter((row) => row.value);
  const formatSpecLabel = (key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const toSpecText = (value: unknown): string => {
    if (value === null || value === undefined) {return "";}
    if (Array.isArray(value)) {return sanitizeDisplayList(value.map((v) => String(v))).join(", ");}
    if (typeof value === "object") {return "";}
    return normalizeDisplayText(String(value));
  };
  const inlineSpecs = (() => {
    const entries: Array<{ label: string; value: string }> = [];
    const seen = new Set<string>();
    const blocked = new Set([
      "category",
      "subcategory",
      "dimensions",
      "materials",
      "finish_options",
      "features",
      "documents",
      "document_titles",
      "certifications",
      "warranty_text",
      "warranty_years",
      "bifma_certified",
      "price_range",
      "overview_sections",
      "dimension_sections",
      "sustainability_text",
      "sustainability_score",
    ]);

    const addEntriesFromObject = (source: unknown) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) {return;}
      for (const [rawKey, rawValue] of Object.entries(
        source as Record<string, unknown>,
      )) {
        const key = rawKey.toLowerCase();
        if (blocked.has(key) || seen.has(key)) {continue;}
        const value = toSpecText(rawValue);
        if (!value) {continue;}
        entries.push({ label: formatSpecLabel(rawKey), value });
        seen.add(key);
      }
    };

    addEntriesFromObject(product.specs);
    addEntriesFromObject(
      metadataRecord?.specifications,
    );
    return entries.slice(0, 16);
  })();

  const hasReturnContext = Boolean(parsedFrom);
  const returnLabel = hasReturnContext
    ? PDP_ROUTE_COPY.ctas.returnToResults
    : PDP_ROUTE_COPY.ctas.returnToCategory;
  const useCasePreview = useCases.slice(0, 4);
  const materialPreview = materials.slice(0, 3).join(", ");
  const finishPreview = finishOptions.slice(0, 3).join(", ");
  const summaryCards = [
    { label: PDP_ROUTE_COPY.summary.bestFor, value: useCasePreview.join(", ") },
    { label: PDP_ROUTE_COPY.ctas.configuration, value: quickConfig },
    { label: PDP_ROUTE_COPY.summary.dimensions, value: dimensions },
    {
      label:
        materials.length > 0
          ? PDP_ROUTE_COPY.summary.materials
          : finishOptions.length > 0
            ? "Finish Options"
            : PDP_ROUTE_COPY.summary.materials,
      value: materials.length > 0 ? materialPreview : finishPreview,
    },
  ].filter((card) => card.value);
  const primarySummaryCards = summaryCards.slice(0, 3);
  const secondarySummaryCards = summaryCards.slice(3);
  const assuranceCards = [
    warrantyText ? { label: "Warranty", value: warrantyText } : null,
    certificationText ? { label: "Certification", value: certificationText } : null,
    sustainabilityText ? { label: "Sustainability", value: sustainabilityText } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const handleAddToQuote = () => {
    trackQuoteCartAdded({
      pathname,
      surface: "pdp",
      productId: routeKey,
    });
    addItem({
      id: `quote-${product.slug || product.id}`,
      name: displayName,
      image: uniqueImages[0],
      href: productRouteWithContext,
      qty: 1,
    });
  };
  const handleCompareToggle = () => {
    trackCompareToggled({
      pathname,
      surface: "pdp",
      categoryId: categoryId || "products",
      productId: routeKey,
      nextState: inCompare ? "removed" : "added",
    });
    toggleCompareItem({
      id: compareId,
      productUrlKey: routeKey,
      categoryId: categoryId || "products",
      name: displayName,
      image: uniqueImages[0],
      href: productRouteWithContext,
    });
  };

  return (
    <HomeMarketingLayout>
    <section
      ref={rootRef}
      className="pdp-page scheme-page pb-20 pt-0 sm:pb-24"
      data-testid="pdp-page"
    >
      {/* Breadcrumb bar */}
      <div className="border-b border-theme-soft bg-panel/88 backdrop-blur-xl">
        <div className="pdp-breadcrumb home-shell-xl typ-label text-body flex min-h-11 min-w-0 items-center gap-1.5 py-2">
          <Link
            href="/products"
            className="hover:text-strong transition-colors"
          >
            Products
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href={categoryRouteWithContext}
            className="hover:text-strong transition-colors"
          >
            {categoryName}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="min-w-0 truncate text-strong font-semibold">
            {displayName}
          </span>
        </div>
      </div>

      <div className="home-shell-xl pdp-shell-band pt-5 lg:pt-6">
        <div className="pdp-shell-grid">
        {/* Left: image gallery — catalog photography / published SVG authority */}
          <div
            className="pdp-media-pane"
            data-testid="pdp-media-pane"
            data-pdp-reveal
          >
            <div className="pdp-media-stack">
          <div className="pdp-media-card">
            <ProductGallery
              images={uniqueImages}
              productName={displayName}
            />
          </div>
          {planSvgThumbUrl ? (
            <div
              className="pdp-plan-symbol-block"
              data-testid="pdp-plan-svg-thumb"
              data-plan-svg-url={planSvgThumbUrl}
              data-pdp-reveal
            >
              <p className="typ-label text-muted pdp-plan-symbol-block__label">
                Plan symbol
              </p>
              <InlinePlanSymbolPreview
                url={planSvgThumbUrl}
                label={`Plan symbol for ${displayName}`}
                size="panel"
                className="pdp-plan-svg-thumb rounded-xl p-2"
              />
            </div>
          ) : null}
        </div>
          </div>

        {/* Right: details panel */}
          <div className="pdp-detail-pane" data-pdp-reveal>
          <div className="pdp-detail-shell">
            {/* Title block */}
            <div className="pdp-section">
              <div
                className="mb-4 h-px w-14 bg-[color:var(--color-bronze-400)]"
                aria-hidden="true"
                data-pdp-reveal
              />
              <Link
                href={categoryRouteWithContext}
                className="pdp-action-label mb-4 flex w-fit items-center gap-2 text-muted transition-all duration-200 hover:text-strong hover:gap-3"
                data-pdp-reveal
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {returnLabel}
              </Link>
              <Link
                href={categoryRouteWithContext}
                className="page-copy-sm text-body mb-3 inline-block transition-colors hover:text-primary"
                data-pdp-reveal
              >
                {categoryName}
              </Link>
              <h1 className="home-heading mb-4 md:mb-5" data-pdp-reveal>
                {displayName}
              </h1>
              {shortOverview ? (
                <p className="page-copy text-body max-w-prose" data-pdp-reveal>
                  {shortOverview}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-2.5" data-pdp-reveal>
                {warrantyText ? (
                  <span className="pdp-chip pdp-chip--soft px-2.5 border-l-2 border-l-[var(--color-primary)]">
                    {warrantyText}
                  </span>
                ) : null}
                {product.metadata?.bifmaCertified && (
                  <span className="pdp-chip pdp-chip--solid px-2.5 border-l-2 border-l-[var(--color-ocean-boat-blue-500)]">
                    BIFMA Certified
                  </span>
                )}
                {typeof product.metadata?.sustainabilityScore === "number" && (
                  <span className="pdp-chip pdp-chip--success px-2.5 border-l-2 border-l-[var(--color-accent-green)]">
                    Eco Score {product.metadata.sustainabilityScore}/10
                  </span>
                )}
              </div>
              <div className="pdp-summary-panel mt-7" data-pdp-scroll-reveal>
                {primarySummaryCards.length > 0 ? (
                  <>
                    <h2 className="typ-h3 text-strong mb-2">
                      Project snapshot
                    </h2>
                    <p className="page-copy-sm text-body mb-4">
                      Core facts for quick technical and commercial assessment.
                    </p>
                    <div className="pdp-summary-grid">
                      {primarySummaryCards.map((card) => (
                        <div
                          key={card.label}
                          className="pdp-summary-card"
                          data-pdp-scroll-reveal
                        >
                          <p className="pdp-card-label mb-1.5">
                            {card.label}
                          </p>
                          <p className="text-sm leading-relaxed text-strong font-medium">
                            {card.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
                {secondarySummaryCards.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {secondarySummaryCards.map((card) => (
                      <span
                        key={card.label}
                        className="pdp-inline-pill"
                      >
                        <span className="font-semibold text-strong">
                          {card.label}:
                        </span>{" "}
                        {card.value}
                      </span>
                    ))}
                  </div>
                ) : null}
                {assuranceCards.length > 0 ? (
                  <div className="mt-5 border-t border-soft pt-5">
                    <p className="pdp-card-label mb-3">Verified product facts</p>
                    <div className="pdp-assurance-grid">
                      {assuranceCards.map((item) => (
                        <div
                          key={item.label}
                          className="pdp-assurance-item"
                        >
                          <span className="font-semibold text-strong">
                            {item.label}:
                          </span>{" "}
                          {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Variant swatches */}
            {product.variants && product.variants.length > 0 && (
              <div className="pdp-section pdp-divider">
                <div className="flex items-center justify-between mb-4">
                  <p className="pdp-section-label">
                    {PDP_ROUTE_COPY.ctas.configuration}
                  </p>
                  <span className="text-muted text-xs">
                    {product.variants.length} options
                  </span>
                </div>
                <div className="pdp-variant-grid mb-4">
                  {product.variants.map((variant: ProductVariant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    return (
                      <button
                        type="button"
                        key={variant.id}
                        onClick={() => handleVariantChange(variant)}
                        title={variant.variantName}
                        aria-label={`Select ${variant.variantName} variant`}
                        aria-pressed={isSelected}
                        className={clsx(
                          "pdp-swatch-button focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                          isSelected
                            ? "border-strong ring-2 ring-strong ring-offset-2 scale-110"
                            : "border-soft hover:border-muted hover:scale-105",
                        )}
                      >
                        {/* PERF-FIX: replaced raw <img> with next/image */}
                        <Image
                          src={
                            variant.galleryImages?.[0] || product.flagshipImage || ""
                          }
                          alt={`${variant.variantName} finish preview for ${displayName}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover scale-150"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            if (!el.dataset.fallback) {
                              el.dataset.fallback = "1";
                              el.classList.add("pdp-swatch-image--fallback");
                            }
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-muted">
                    <span className="font-semibold text-strong">
                      Selected:
                    </span>{" "}
                    {selectedVariant.variantName}
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="pdp-section" data-pdp-reveal>
              <div className="pdp-bronze-rule" aria-hidden="true" />
              <div className="pdp-cta-panel" data-testid="pdp-cta-panel">
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-strong">
                    Take the next step
                  </p>
                  <p className="text-sm leading-relaxed text-muted">
                    Add this product to your shortlist, send a direct enquiry, or move into planning support.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddToQuote}
                  className="pdp-cta-primary group mb-2 flex w-full items-center justify-between"
                >
                  <span className="pdp-action-label">
                    {PDP_ROUTE_COPY.ctas.addToQuote}
                  </span>
                  <ShoppingCart className="w-4 h-4" />
                </button>
                {routeKey ? (
                  <button
                    type="button"
                    onClick={handleCompareToggle}
                    className={clsx(
                      "pdp-cta-secondary group mb-2 flex w-full items-center justify-between",
                      inCompare && "pdp-cta-secondary--active",
                    )}
                  >
                    <span className="pdp-action-label">
                      {inCompare
                        ? PDP_ROUTE_COPY.ctas.addedToCompare
                        : PDP_ROUTE_COPY.ctas.addToCompare}
                    </span>
                    <GitCompareArrows className="w-4 h-4" />
                  </button>
                ) : null}
                <MarketingCtaLink
                  href="/contact"
                  label={PDP_ROUTE_COPY.ctas.requestQuote}
                  surface="pdp"
                  variant="outline"
                  className="mb-2 w-full justify-center"
                >
                  {PDP_ROUTE_COPY.ctas.requestQuote}
                </MarketingCtaLink>
                {/*
                  Product-aware entry: deep-link guest workspace (not marketing chooser).
                  Continuity: siteProduct / siteCategory / siteSource via PlannerLaunchLink.
                  Marketing home/nav still use GUEST_PLANNER_CHOOSER_HREF.
                */}
                <PlannerLaunchLink
                  href={GUEST_PLANNER_WORKSPACE_HREF}
                  surface="pdp"
                  label={PDP_ROUTE_COPY.ctas.designInPlanner}
                  productSlug={product.slug || product.id}
                  // Only a catalog category id (e.g. seating) — never categoryRoute path.
                  categoryId={categoryId}
                  data-testid="pdp-design-in-planner"
                  className="pdp-cta-secondary group mb-2 flex w-full items-center justify-between"
                >
                  <span className="pdp-action-label">
                    {PDP_ROUTE_COPY.ctas.designInPlanner}
                  </span>
                  <ArrowLeft className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1" />
                </PlannerLaunchLink>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <MarketingCtaLink
                    href="/planning"
                    label={PDP_ROUTE_COPY.ctas.planning}
                    surface="pdp"
                    variant="outline"
                    className="w-full justify-center"
                  >
                    {PDP_ROUTE_COPY.ctas.planning}
                  </MarketingCtaLink>
                  <MarketingCtaLink
                    href="/downloads"
                    label={PDP_ROUTE_COPY.ctas.resourceDesk}
                    surface="pdp"
                    variant="outline"
                    className="w-full justify-center"
                  >
                    {PDP_ROUTE_COPY.ctas.resourceDesk}
                  </MarketingCtaLink>
                </div>
                <div className="mt-4 border-t border-soft pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                    aria-label={PDP_ROUTE_COPY.ctas.copyLink}
                    className="pdp-copy-link inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {PDP_ROUTE_COPY.ctas.copyLink}
                  </button>
                  <p className="mt-3 text-xs text-muted">
                    Final commercial terms, lead time, and delivery scope are confirmed before order placement.
                  </p>
                </div>
              </div>
            </div>

            {useCasePreview.length > 0 && (
              <div className="mt-8 border-t border-soft pt-7">
                <h2 className="typ-h3 mb-4 text-strong">
                  {PDP_ROUTE_COPY.summary.useCases}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {useCasePreview.map((useCase) => (
                    <span
                      key={useCase}
                      className="rounded-full border border-soft bg-panel px-3 py-1.5 text-xs font-medium text-body"
                    >
                      {useCase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="pdp-section pdp-divider">
              <h2 className="typ-h3 mb-4 text-strong">
                {PDP_ROUTE_COPY.ctas.specifications}
              </h2>
              <div className="pdp-spec-table mb-7">
                {specRows.map((row, index) => (
                  <div
                    key={row.label}
                    className={`pdp-spec-row ${index % 2 === 0 ? "bg-panel" : "bg-soft/70"}`}
                  >
                    <span className="pdp-card-label w-28 shrink-0 pt-0.5 text-subtle">
                      {row.label}
                    </span>
                    <span className="text-sm leading-relaxed text-strong font-medium">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pdp-details-stack">
                {features.length > 0 && (
                  <details className="pdp-disclosure" open>
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">
                        {PDP_ROUTE_COPY.ctas.keyFeatures}
                      </span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <ul className="grid gap-3">
                        {features.slice(0, 8).map((f: string, i: number) => (
                          <li
                            key={i}
                            className="pdp-feature-item flex min-h-full items-start gap-3 rounded-2xl border border-soft bg-soft px-4 py-3 text-sm leading-relaxed text-body"
                          >
                            <span className="text-subtle mt-0.5 shrink-0">-</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                {inlineSpecs.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">
                        {PDP_ROUTE_COPY.ctas.technicalDetails}
                      </span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="pdp-inline-spec-grid grid gap-3">
                        {inlineSpecs.map((row) => (
                          <div
                            key={row.label}
                            className="rounded-2xl border border-soft bg-panel p-4"
                          >
                            <span className="pdp-card-label mb-2 block">
                              {row.label}
                            </span>
                            <span className="text-sm leading-relaxed text-body">
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {fullOverview ? (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Overview</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="rounded-2xl border border-soft bg-soft px-4 py-4 text-sm leading-relaxed text-body">
                        {fullOverview}
                      </div>
                    </div>
                  </details>
                ) : null}

                {materials.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Materials</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="flex flex-wrap gap-2">
                        {materials.map((material) => (
                          <span
                            key={material}
                            className="rounded-full border border-soft bg-soft px-3 py-1.5 text-xs text-body"
                          >
                            {material}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )}

                {finishOptions.length > 0 && (
                  <details className="pdp-disclosure">
                    <summary className="pdp-disclosure__summary">
                      <span className="pdp-section-label text-muted">Finish Options</span>
                    </summary>
                    <div className="pdp-disclosure__body">
                      <div className="flex flex-wrap gap-2">
                        {finishOptions.map((finish) => (
                          <span
                            key={finish}
                            className="rounded-full border border-soft bg-soft px-3 py-1.5 text-xs text-body"
                          >
                            {finish}
                          </span>
                        ))}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="home-shell-xl pdp-route-cta-band pb-6 pt-8 md:pt-10">
        <RouteCtaBand
          kicker="Planning desk"
          title="Specify this product in a real layout"
          description="Share seat count, finish preferences, and site constraints — we propose a practical path from catalog to install."
          actions={[
            { href: "/contact", label: PDP_ROUTE_COPY.ctas.requestQuote, variant: "primary" },
            { href: "/planner", label: PDP_ROUTE_COPY.ctas.designInPlanner, variant: "outline-light" },
            { href: categoryRouteWithContext, label: returnLabel, variant: "outline-light" },
          ]}
        />
      </div>

      <div className="home-shell-xl pb-20 pt-6 md:pt-8">
        <Reviews productId={product.id} />
      </div>
      <CompareDock />

      <div
        className="pdp-mobile-bar md:hidden"
        data-testid="pdp-mobile-bar"
        aria-label="Product actions"
      >
        <button
          type="button"
          onClick={handleAddToQuote}
          className="pdp-mobile-bar__primary"
        >
          <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
          <span>{PDP_ROUTE_COPY.ctas.addToQuote}</span>
        </button>
        {routeKey ? (
          <button
            type="button"
            onClick={handleCompareToggle}
            className={clsx(
              "pdp-mobile-bar__secondary",
              inCompare && "pdp-mobile-bar__secondary--active",
            )}
            aria-pressed={inCompare}
          >
            <GitCompareArrows className="h-4 w-4 shrink-0" aria-hidden />
            <span className="sr-only">
              {inCompare
                ? PDP_ROUTE_COPY.ctas.addedToCompare
                : PDP_ROUTE_COPY.ctas.addToCompare}
            </span>
          </button>
        ) : null}
      </div>
    </section>
    </HomeMarketingLayout>
  );
}

