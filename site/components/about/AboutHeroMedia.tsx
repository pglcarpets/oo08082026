"use client";

import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { ABOUT_HERO_IMAGE, ABOUT_HERO_MEDIA } from "@/features/site/data/aboutPage";

/**
 * About hero media — graded install still only.
 */
export function AboutHeroMedia() {
  return (
    <EditorialHeroMedia prefix="about" image={ABOUT_HERO_IMAGE} media={ABOUT_HERO_MEDIA} />
  );
}
