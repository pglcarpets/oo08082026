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
  fetchPriority?: "high" | "low" | "auto";
};

/** Raster marketing image with normalize → hero → product-placeholder fallback chain. */
export function MarketingImage({
  src,
  alt,
  className,
  sizes,
  fill = true,
  priority = false,
  fetchPriority,
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
      fetchPriority={fetchPriority}
      sizes={sizes}
      className={className}
      onError={() => {
        setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1));
      }}
    />
  );
}
