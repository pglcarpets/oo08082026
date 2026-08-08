"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { CLIENTS_HERO_IMAGE, CLIENTS_HERO_MEDIA } from "@/features/site/data/clientsPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type ClientsHeroProps = {
  kicker?: string;
  titleLead: string;
  titleAccent: string;
  subtitle: string;
};

/** Clients editorial hero — one signature entrance beat (copy stagger). */
export function ClientsHero({ kicker, titleLead, titleAccent, subtitle }: ClientsHeroProps) {
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

      const revealTargets = heroRef.current.querySelectorAll("[data-clients-hero-reveal]");
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
      className="clients-hero"
      aria-labelledby="clients-hero-heading"
      data-testid="clients-hero"
    >
      <EditorialHeroMedia prefix="clients" image={CLIENTS_HERO_IMAGE} media={CLIENTS_HERO_MEDIA} />
      <div className="clients-hero__scrim" aria-hidden="true" />
      <div className="clients-hero__layout">
        <div className="clients-hero__copy">
          {kicker ? (
            <p
              data-clients-hero-reveal
              className="home-kicker clients-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {kicker}
            </p>
          ) : null}
          <h1 id="clients-hero-heading" className="clients-hero__title">
            <span data-clients-hero-reveal className="block">
              {titleLead}{" "}
              <span className="text-accent-italic-on-dark">{titleAccent}</span>
            </span>
          </h1>
          <p data-clients-hero-reveal className="clients-hero__subtitle">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
