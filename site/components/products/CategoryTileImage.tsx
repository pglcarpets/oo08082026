"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { DEFAULT_HERO_FALLBACK } from "@/features/site/data/homepage";
import { normalizeAssetPath, PRODUCT_IMAGE_FALLBACK } from "@/lib/assetPaths";

type CategoryTileImageProps = {
  src: string;
  alt: string;
};

/** Square category tile — contain + padding so product stills read like the reference hub. */
export function CategoryTileImage({ src, alt }: CategoryTileImageProps) {
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
      width={1200}
      height={1200}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className="products-category-tile__img"
      onError={() => {
        setCandidateIndex((current) => Math.min(current + 1, candidates.length - 1));
      }}
    />
  );
}
