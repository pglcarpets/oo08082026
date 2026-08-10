"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { DEFAULT_HERO_FALLBACK } from "@/features/site/data/homepage";
import { normalizeAssetPath, PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";

type MarketingImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes: string;
  fill?: boolean;
  priority?: boolean;
  /**
   * Native lazy/eager. Default: lazy when not priority.
   * Use `eager` for transform-based carousels/marquees where layout boxes
   * never intersect the viewport (lazy would never fire).
   */
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** Skip `/_next/image` for already-compressed static assets (e.g. marketing hero webp). */
  unoptimized?: boolean;
};

/** Raster marketing image with normalize → hero → product-placeholder fallback chain. */
export function MarketingImage({
  src,
  alt,
  className,
  sizes,
  fill = true,
  priority = false,
  loading,
  fetchPriority,
  unoptimized = false,
}: MarketingImageProps) {
  const candidates = useMemo(() => {
    const raw = [src, DEFAULT_HERO_FALLBACK, PRODUCT_IMAGE_FALLBACK].filter(Boolean);
    const resolved = raw.map((path) => normalizeAssetPath(path) || path);
    return Array.from(new Set(resolved));
  }, [src]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const resolvedSrc =
    candidates[Math.min(candidateIndex, candidates.length - 1)] ?? PRODUCT_IMAGE_FALLBACK;

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill={fill}
      priority={priority}
      loading={priority ? undefined : (loading ?? "lazy")}
      fetchPriority={fetchPriority}
      sizes={sizes}
      className={className}
      unoptimized={unoptimized}
      onError={() => {
        setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1));
      }}
    />
  );
}
