"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import clsx from "clsx";
import { Armchair as ChairIcon } from "@phosphor-icons/react";
import {
  PRODUCT_IMAGE_FALLBACK,
  isProductImageFallback,
} from "@/lib/assetPaths";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

function buildGalleryCandidates(images: readonly string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const raw of images) {
    const value = String(raw || "").trim();
    if (!value || seen.has(value) || isProductImageFallback(value)) continue;
    seen.add(value);
    ordered.push(value);
  }

  if (ordered.length === 0) {
    const fallback = images
      .map((raw) => String(raw || "").trim())
      .find((value) => value && isProductImageFallback(value));
    if (fallback) {return [fallback];}
  }

  return ordered;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const candidates = useMemo(() => buildGalleryCandidates(images), [images]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        galleryRef.current &&
        (galleryRef.current.contains(document.activeElement) ||
          (target && galleryRef.current.contains(target)))
      ) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : Math.max(candidates.length - 1, 0),
          );
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < candidates.length - 1 ? prev + 1 : 0,
          );
        }
      }
    };
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [candidates.length]);

  const markFailed = (src: string) => {
    setFailedKeys((current) => {
      if (current.has(src)) return current;
      const next = new Set(current);
      next.add(src);
      return next;
    });
  };

  const resolveSrc = (index: number): string => {
    const start = index % candidates.length;
    for (let offset = 0; offset < candidates.length; offset += 1) {
      const candidate = candidates[(start + offset) % candidates.length];
      if (!failedKeys.has(candidate)) return candidate;
    }
    return PRODUCT_IMAGE_FALLBACK;
  };

  const safeIndex =
    selectedIndex >= candidates.length ? 0 : selectedIndex;
  const currentImage = resolveSrc(safeIndex);
  const showingFallback = isProductImageFallback(currentImage);
  const visibleThumbs = candidates;

  const handleMainError = () => {
    markFailed(currentImage);
    setSelectedIndex((prev) => prev);
  };

  return (
    <div
      ref={galleryRef}
      className="product-gallery"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${productName} gallery`}
    >
      <div
        className={clsx(
          "product-gallery__main",
          showingFallback && "product-gallery__main--placeholder",
        )}
      >
        {showingFallback ? (
          <div
            className="product-gallery__placeholder"
            role="img"
            aria-label={`${productName} image unavailable`}
          >
            <ChairIcon size={48} weight="duotone" aria-hidden />
            <p className="product-gallery__placeholder-copy">Photo coming soon</p>
          </div>
        ) : (
          <Image
            key={currentImage}
            src={currentImage}
            alt={`Primary product gallery image of ${productName}`}
            fill
            priority
            fetchPriority="high"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 70vw"
            className="product-gallery__main-img"
            onError={handleMainError}
          />
        )}

        {candidates.length > 1 && !showingFallback ? (
          <div
            className="product-gallery__count"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="sr-only">
              Image {safeIndex + 1} of {candidates.length} for {productName}
            </span>
            <span aria-hidden="true">
              {safeIndex + 1} / {candidates.length}
            </span>
          </div>
        ) : null}
      </div>

      {visibleThumbs.length > 1 ? (
        <div className="product-gallery__thumbs">
          {visibleThumbs.map((img, idx) => {
            const candidateIndex = candidates.indexOf(img);
            const thumbIndex = candidateIndex >= 0 ? candidateIndex : idx;
            return (
              <button
                key={`${img}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(thumbIndex)}
                aria-label={`Show gallery image ${idx + 1} of ${visibleThumbs.length} for ${productName}`}
                aria-pressed={safeIndex === thumbIndex}
                className={clsx(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 bg-soft transition-all outline-none focus-visible:ring-2 focus-visible:ring-strong focus-visible:ring-offset-2 md:h-20 md:w-20",
                  safeIndex === thumbIndex
                    ? "product-gallery__thumb--active border-strong opacity-100"
                    : "border-transparent opacity-60 hover:opacity-100 hover:border-muted",
                )}
                title={`View ${productName} image ${idx + 1}`}
              >
                <Image
                  src={resolveSrc(thumbIndex)}
                  alt={`Gallery image ${idx + 1} of ${productName}`}
                  fill
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 768px) 18vw, 5rem"
                  className="product-gallery__thumb-img"
                  onError={() => markFailed(img)}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
