"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, GitDiff as GitCompareArrows, X } from "@phosphor-icons/react";
import { useMemo, useState, type ReactNode } from "react";
import clsx from "clsx";

import { sanitizeDisplayText } from "@/lib/displayText";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";
import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";
import { SUSTAINABILITY_THRESHOLDS, type ActiveFilters } from "@/lib/catalog/site/filters";
import { trackCompareToggled } from "@/lib/analytics/siteEvents";
import { useProductCompare } from "@/lib/store/productCompare";

import {
  buildImageCandidates,
  fallbackAltText,
  type FlatProduct,
  getDisplayDimensions,
  getDisplayMaterials,
  getProductRouteKey,
} from "./FilterGrid.helpers";

function getProductEyebrow(product: FlatProduct): string {
  const subcategory = sanitizeDisplayText(
    String(product.metadata?.subcategory || ""),
  );
  if (subcategory) {return subcategory;}
  const seriesName = sanitizeDisplayText(product.seriesName || "");
  if (seriesName) {return seriesName;}
  return "";
}

export function AccordionSection({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-soft last:border-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-start group"
        aria-expanded={open}
      >
        <span className="filter-ui-heading group-hover:text-heading transition-colors flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 ? (
            <span className="filter-ui-count">
              {count}
            </span>
          ) : null}
        </span>
        {open ? (
          <ChevronUp className="text-muted w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="text-muted w-3.5 h-3.5" />
        )}
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  if (!options.length) {
    return (
      <p className="text-muted text-xs italic">No options available</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {options.map((opt) => (
        <li key={opt}>
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="w-3.5 h-3.5 accent-heading rounded-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
            />
            <span className="text-sm text-body group-hover:text-heading transition-colors capitalize">
              {opt}
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}

export function SustainabilityButtons({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={clsx(
          "px-3 py-1.5 text-xs rounded-sm border transition-all font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          selected === null
            ? "bg-accent1 border-accent1 text-heading"
            : "bg-panel text-body border-muted hover:border-strong",
        )}
      >
        Any
      </button>
      {SUSTAINABILITY_THRESHOLDS.map((threshold) => (
        <button
          key={threshold}
          type="button"
          onClick={() => onSelect(selected === threshold ? null : threshold)}
          className={clsx(
            "px-3 py-1.5 text-xs rounded-sm border transition-all font-medium focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
            selected === threshold
              ? "bg-accent1 border-accent1 text-heading"
              : "bg-panel text-body border-muted hover:border-strong",
        )}
        >
          &gt;= {threshold}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer py-1">
      <span className="text-sm text-body">{label}</span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "relative w-9 h-5 rounded-full transition-colors flex items-center shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-accent1" : "bg-hover",
        )}
      >
        <span
          className={clsx(
            "absolute w-3.5 h-3.5 bg-panel rounded-full shadow transition-all",
            checked ? "left-[1.125rem]" : "left-[0.1875rem]",
          )}
        />
      </button>
    </label>
  );
}

export function ProductCard({
  product,
  categoryId,
  categoryName,
  contextQueryString,
}: {
  product: FlatProduct;
  categoryId: string;
  categoryName: string;
  contextQueryString: string;
}) {
  const compareItems = useProductCompare((state) => state.items);
  const toggleCompareItem = useProductCompare((state) => state.toggleItem);
  const imageCandidates = useMemo(
    () => buildImageCandidates(product, categoryId),
    [product.flagshipImage, product.images, product.slug, categoryId],
  );
  const [imgIndex, setImgIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);
  const imgSrc = imgFailed
    ? PRODUCT_IMAGE_FALLBACK
    : imageCandidates[imgIndex] ||
      imageCandidates[0] ||
      PRODUCT_IMAGE_FALLBACK;
  const displayName = sanitizeDisplayText(product.name);
  const routeKey = getProductRouteKey(product);
  const compareId = `compare-${categoryId}-${routeKey}`;
  const inCompare = compareItems.some((item) => item.id === compareId);
  const baseHref = `/products/${categoryId}/${routeKey}`;
  const productHref = contextQueryString
    ? `${baseHref}?from=${encodeURIComponent(contextQueryString)}`
    : baseHref;
  const imageAlt =
    product.altText ||
    (product.metadata as Record<string, unknown> | undefined)?.ai_alt_text?.toString() ||
    (product.metadata as Record<string, unknown> | undefined)?.aiAltText?.toString() ||
    fallbackAltText(displayName, categoryName);
  const eyebrow = getProductEyebrow(product);
  const dimensions = getDisplayDimensions(product);
  const materials = getDisplayMaterials(product);

  return (
    <article
      className="catalog-card catalog-card--compact group flex flex-col justify-between h-full"
      data-catalog-card
    >
      <button
        type="button"
        onClick={() => {
          trackCompareToggled({
            pathname: window.location.pathname,
            surface: "category-grid-card",
            categoryId,
            productId: routeKey,
            nextState: inCompare ? "removed" : "added",
          });
          toggleCompareItem({
            id: compareId,
            productUrlKey: routeKey,
            categoryId,
            name: displayName,
            image: imgSrc,
            href: productHref,
          });
        }}
        aria-label={inCompare ? "Remove from compare" : "Add to compare"}
        className={clsx(
          "catalog-card__compare",
          inCompare
            ? "catalog-card__compare--active"
            : "catalog-card__compare--idle",
        )}
      >
        <GitCompareArrows className="h-3 w-3" />
        <span className="hidden sm:inline">{inCompare ? "Compared" : "Compare"}</span>
      </button>

      <Link href={productHref} className="flex-1 flex flex-col justify-between">
        <div className="catalog-card__media">
          {/* One image layer: key remounts on candidate change; no stacked imgs */}
          <div className="catalog-card__media-layer">
            <Image
              key={`${product.id}-${imgSrc}`}
              src={imgSrc}
              alt={imageAlt}
              loading="lazy"
              width={1200}
              height={900}
              sizes="(max-width: 639px) 100vw, (max-width: 75rem) 50vw, (max-width: 96rem) 33vw, 25vw"
              className="catalog-card__media-img h-full w-full object-contain object-center transition-transform duration-500 group-hover:scale-[1.03]"
              onError={() => {
                if (imgFailed) {return;}
                setImgIndex((current) => {
                  const next = current + 1;
                  if (next < imageCandidates.length) {return next;}
                  setImgFailed(true);
                  return current;
                });
              }}
            />
          </div>
          <div className="catalog-card__badge-row">
            {product.metadata?.bifmaCertified ? (
              <span className="catalog-card__badge">BIFMA</span>
            ) : null}
          </div>
        </div>
        <div className="catalog-card__body flex-1 flex flex-col justify-between">
          <div>
            {eyebrow ? <p className="catalog-card__eyebrow">{eyebrow}</p> : null}
            <h2 className="text-lg font-semibold tracking-tight text-strong transition-colors group-hover:text-primary">{displayName}</h2>
          </div>
          <div className="catalog-card__meta mt-auto flex flex-col gap-1">
            <p
              className="catalog-card__dims page-copy-sm text-muted line-clamp-1"
              aria-hidden={dimensions ? undefined : true}
            >
              {dimensions || "\u00A0"}
            </p>
            {materials ? (
              <span className="catalog-card__signal">
                {materials}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ActiveChips({
  filters,
  onRemove,
  onClearAll,
  total,
}: {
  filters: ActiveFilters;
  onRemove: (key: string, value?: string | number) => void;
  onClearAll: () => void;
  total: number;
}) {
  if (total === 0) {return null;}
  const chips: { label: string; key: string; value?: string | number }[] = [];
  if (filters.query.trim()) {
    chips.push({
      label: `${CATEGORY_ROUTE_COPY.activeSearchLabel}: ${filters.query.trim()}`,
      key: "query",
      value: filters.query.trim(),
    });
  }
  if (filters.series !== "all") {chips.push({ label: `Series: ${filters.series}`, key: "series" });}
  filters.subcategory.forEach((v) =>
    chips.push({ label: `Subcategory: ${v}`, key: "subcategory", value: v }),
  );
  filters.priceRange.forEach((v) =>
    chips.push({ label: `Price: ${v}`, key: "priceRange", value: v }),
  );
  filters.material.forEach((v) =>
    chips.push({ label: v, key: "material", value: v }),
  );
  if (filters.hasHeadrest) {chips.push({ label: "With headrest", key: "hasHeadrest" });}
  if (filters.isHeightAdjustable) {chips.push({ label: "Height adjustable", key: "isHeightAdjustable" });}
  if (filters.bifmaCertified) {chips.push({ label: "BIFMA certified", key: "bifmaCertified" });}
  if (filters.isStackable) {chips.push({ label: "Stackable", key: "isStackable" });}
  if (typeof filters.ecoMin === "number") {
    chips.push({ label: `Eco >= ${filters.ecoMin}`, key: "ecoMin", value: filters.ecoMin });
  }

  return (
    <div className="border-b border-soft py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="filter-ui-label">
          {CATEGORY_ROUTE_COPY.activeFiltersLabel}
        </span>
        <span className="typ-micro text-muted">
          {CATEGORY_ROUTE_COPY.activeCountLabel.replace("{count}", String(total))}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={`${chip.key}-${chip.value ?? ""}`}
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-soft bg-soft px-3 py-1 typ-micro text-body transition-colors hover:border-strong hover:text-heading"
          >
            <span className="capitalize">{chip.label}</span>
            <X className="w-3 h-3" />
          </button>
        ))}
        <button
          type="button"
          onClick={onClearAll}
          className="typ-micro min-h-11 inline-flex items-center text-muted hover:text-heading underline transition-colors ml-1"
        >
          {CATEGORY_ROUTE_COPY.clearFiltersCta}
        </button>
      </div>
    </div>
  );
}
