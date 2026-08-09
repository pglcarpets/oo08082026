"use client";

/**
 * Below-the-fold homepage sections as separate client chunks.
 * Keeps InteractiveTools / WhyChooseUs / Showcase / ContactTeaser (GSAP + Zod)
 * off the initial homepage JS path until this module hydrates.
 */
import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const InteractiveTools = dynamic(
  () =>
    import("@/components/home/InteractiveTools").then((m) => ({
      default: m.InteractiveTools,
    })),
  { ssr: true },
);

const WhyChooseUs = dynamic(
  () =>
    import("@/components/home/WhyChooseUs").then((m) => ({
      default: m.WhyChooseUs,
    })),
  { ssr: true },
);

const ShowcaseCarousel = dynamic(
  () =>
    import("@/components/home/ShowcaseCarousel").then((m) => ({
      default: m.ShowcaseCarousel,
    })),
  { ssr: true },
);

const ContactTeaser = dynamic(
  () =>
    import("@/components/shared/ContactTeaser").then((m) => ({
      default: m.ContactTeaser,
    })),
  { ssr: true },
);

export type HomeShowcaseProps = {
  sectionLabel: string;
  sectionAriaLabel: string;
  sectionTitle: ReactNode;
  items: Array<{
    id: string;
    name: string;
    label: string;
    image: string;
    link: string;
  }>;
  browseLink: string;
  browseLabel: string;
};

export function HomeDeferredSections({ showcase }: { showcase: HomeShowcaseProps }) {
  return (
    <>
      <InteractiveTools />
      <WhyChooseUs />
      <ShowcaseCarousel
        sectionLabel={showcase.sectionLabel}
        sectionAriaLabel={showcase.sectionAriaLabel}
        sectionTitle={showcase.sectionTitle}
        items={showcase.items}
        browseLink={showcase.browseLink}
        browseLabel={showcase.browseLabel}
      />
      <ContactTeaser />
    </>
  );
}
