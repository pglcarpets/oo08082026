"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { COMPARE_ROUTE_COPY } from "@/features/site/data/routeCopy";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type ComparePageHeaderProps = {
  backHref: string;
  backLabel: string;
  itemCount: number;
};

/** Commerce compare header — utilitarian layout with a single GSAP load stagger. */
export function ComparePageHeader({ backHref, backLabel, itemCount }: ComparePageHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !headerRef.current) {
        return;
      }

      const revealTargets = headerRef.current.querySelectorAll("[data-compare-reveal]");
      if (!revealTargets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(revealTargets, {
          y: GSAP_REVEAL.y,
          opacity: GSAP_REVEAL.opacity,
          duration: GSAP_REVEAL.duration,
          stagger: GSAP_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
        });
      }, headerRef);

      return () => ctx.revert();
    },
    { scope: headerRef, dependencies: [motionReady] },
  );

  return (
    <section
      ref={headerRef}
      className="compare-header"
      aria-labelledby="compare-heading"
    >
      <div className="home-shell-xl compare-header__grid">
        <div>
          <Link
            data-compare-reveal
            href={backHref}
            className="compare-header__back typ-body-sm inline-flex min-h-11 items-center gap-1.5 text-muted transition-colors hover:text-strong"
          >
            ← Back to {backLabel}
          </Link>
          <p data-compare-reveal className="typ-label text-contrast-accent">
            {COMPARE_ROUTE_COPY.kicker}
          </p>
          <h1 id="compare-heading" data-compare-reveal className="home-heading compare-header__title">
            {COMPARE_ROUTE_COPY.title}
          </h1>
          <p data-compare-reveal className="page-copy compare-header__copy text-body">
            {COMPARE_ROUTE_COPY.description}
          </p>
        </div>

        <aside
          data-compare-reveal
          className="compare-status scheme-panel-dark scheme-border rounded-2xl border p-6 md:p-7"
          aria-label="Comparison selection status"
        >
          <p className="typ-label text-inverse-muted">
            {COMPARE_ROUTE_COPY.selectionStatusLabel}
          </p>
          <p className="compare-status__count">
            <span className="sr-only">Products selected: </span>
            {itemCount}/4
          </p>
          <p className="page-copy-sm mt-3 text-inverse-body">
            {itemCount > 0
              ? COMPARE_ROUTE_COPY.mobileHint
              : COMPARE_ROUTE_COPY.selectionEmptyHint}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <MarketingCtaLink
              href="/products"
              label={COMPARE_ROUTE_COPY.browseCta}
              surface="compare-page"
              variant="outline-light"
            >
              {COMPARE_ROUTE_COPY.browseCta}
            </MarketingCtaLink>
            <MarketingCtaLink
              href="/contact?intent=quote&source=compare"
              label={COMPARE_ROUTE_COPY.primaryCta}
              surface="compare-page"
              variant="primary"
            >
              {COMPARE_ROUTE_COPY.primaryCta}
            </MarketingCtaLink>
          </div>
        </aside>
      </div>
    </section>
  );
}
