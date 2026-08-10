"use client";

import { useMemo } from "react";

import { MarketingImage } from "@/components/site/MarketingImage";
import { normalizeAssetPath } from "@/lib/assetPaths";

export type EditorialHeroMediaAssets = {
  poster: string;
};

export type EditorialHeroImage = {
  src: string;
  alt: string;
};

type EditorialHeroMediaProps = {
  /** BEM prefix matching FOCSS (e.g. `about`, `contact`, `service`, `showrooms`). */
  prefix: string;
  image: EditorialHeroImage;
  media: EditorialHeroMediaAssets;
};

/**
 * Editorial route hero media — graded still only (poster / install photography).
 * Hero video loops were removed; LCP stays on the still with `fetchPriority="high"`.
 *
 * Marketing hero `.webp` files are already size-capped for LCP. Serving them
 * through `/_next/image` re-encodes to JPEG, sets Content-Disposition: attachment,
 * and fans out multiple srcset widths (1080/1200/1920) that clutter the console
 * without improving quality. Use unoptimized for those static assets.
 */
export function EditorialHeroMedia({ prefix, image, media }: EditorialHeroMediaProps) {
  const src = useMemo(() => {
    const primary = image.src || media.poster;
    return normalizeAssetPath(primary) || primary;
  }, [image.src, media.poster]);

  const alreadyCompressedHero =
    typeof src === "string" &&
    src.includes("/assets/marketing/") &&
    /\.webp(?:\?|$)/i.test(src);

  return (
    <>
      <div className={`${prefix}-hero__ambient`} aria-hidden="true" />
      <div className={`${prefix}-hero__media`}>
        <MarketingImage
          src={src}
          alt={image.alt}
          sizes="100vw"
          className={`${prefix}-hero__img`}
          priority
          fetchPriority="high"
          unoptimized={alreadyCompressedHero}
        />
        <div className={`${prefix}-hero__grade`} aria-hidden="true" />
      </div>
    </>
  );
}
