"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { LEGAL_HERO_IMAGE, LEGAL_HERO_MEDIA } from "@/features/site/data/legalPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type LegalRouteHeroProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  testId?: string;
};

/** Compact editorial hero for legal routes — graded still + GSAP copy stagger. */
export function LegalRouteHero({ title, subtitle, testId = "legal-hero" }: LegalRouteHeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !heroRef.current) {
        return;
      }

      const revealTargets = heroRef.current.querySelectorAll("[data-legal-hero-reveal]");
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
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef, dependencies: [motionReady] },
  );

  return (
    <section
      ref={heroRef}
      className="legal-hero legal-hero--compact"
      aria-labelledby="legal-hero-heading"
      data-testid={testId}
    >
      <EditorialHeroMedia prefix="legal" image={LEGAL_HERO_IMAGE} media={LEGAL_HERO_MEDIA} />
      <div className="legal-hero__scrim" aria-hidden="true" />

      <div className="legal-hero__layout">
        <div className="legal-hero__copy">
          <h1 id="legal-hero-heading" className="legal-hero__title">
            <span data-legal-hero-reveal className="block">
              {title}
            </span>
          </h1>
          {subtitle ? (
            <p data-legal-hero-reveal className="legal-hero__subtitle">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
