"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { Button } from "@/components/ui/Button";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import {
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  gsapReducedMotion,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import { ADMIN_ENTRY_HERO_CONTENT, ADMIN_ENTRY_HERO_MEDIA } from "./adminEntryContent";

registerGsapPlugins();

type AdminEntryHeroProps = {
  /** Element id of the hub content this hero's CTA scrolls to. */
  hubTargetId: string;
};

/**
 * Admin entry hero — the first landing moment inside the authenticated admin shell.
 * Signature motion moment for `/admin`: load-in copy cascade over a graded, systematic
 * workstation loop. Reduced motion drops straight to the poster with no cascade.
 */
export default function AdminEntryHero({ hubTargetId }: AdminEntryHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMotionReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion()) {
        return;
      }

      const revealTargets = copyRef.current?.querySelectorAll("[data-hero-reveal]");
      if (!revealTargets?.length) {
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
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [motionReady] },
  );

  const handleEnterWorkspace = () => {
    const target = document.getElementById(hubTargetId);
    target?.scrollIntoView({
      behavior: gsapReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
    target?.focus({ preventScroll: true });
  };

  return (
    <section
      ref={sectionRef}
      className="admin-entry-hero"
      aria-labelledby="admin-entry-heading"
    >
      <EditorialHeroMedia
        prefix="admin-entry"
        image={{ src: ADMIN_ENTRY_HERO_MEDIA.poster, alt: ADMIN_ENTRY_HERO_MEDIA.alt }}
        media={ADMIN_ENTRY_HERO_MEDIA}
      />
      <div className="admin-entry-hero__scrim" aria-hidden="true" />

      <div className="admin-entry-hero__layout">
        <div ref={copyRef} className="admin-entry-hero__copy">
          <p data-hero-reveal className="admin-entry-hero__kicker">
            {ADMIN_ENTRY_HERO_CONTENT.kicker}
          </p>
          <h1 id="admin-entry-heading" data-hero-reveal className="admin-entry-hero__title">
            {ADMIN_ENTRY_HERO_CONTENT.title}
          </h1>
          <p data-hero-reveal className="admin-entry-hero__subtitle">
            {ADMIN_ENTRY_HERO_CONTENT.subtitle}
          </p>
          <div data-hero-reveal className="admin-entry-hero__actions">
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="admin-entry-hero__cta"
              onClick={handleEnterWorkspace}
            >
              {ADMIN_ENTRY_HERO_CONTENT.cta}
              <ArrowDown size={16} weight="bold" aria-hidden />
            </Button>
            <p className="admin-entry-hero__meta">{ADMIN_ENTRY_HERO_CONTENT.meta}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
