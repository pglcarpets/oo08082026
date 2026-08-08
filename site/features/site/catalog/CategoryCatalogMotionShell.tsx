"use client";

/**
 * Light GSAP shell for /products/[category] listing chrome.
 * Header stagger + product-card scroll reveal (parity with portal SVG catalog).
 */

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export function CategoryCatalogMotionShell({
  children,
  className,
  testId = "category-catalog",
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly testId?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !rootRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const heroTargets = rootRef.current?.querySelectorAll(
          "[data-catalog-reveal]",
        );
        if (heroTargets?.length) {
          gsap.from(heroTargets, {
            y: GSAP_REVEAL.y,
            opacity: GSAP_REVEAL.opacity,
            duration: GSAP_REVEAL.duration,
            stagger: GSAP_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
          });
        }

        const cards = rootRef.current?.querySelectorAll("[data-catalog-card]");
        if (cards?.length) {
          gsap.from(cards, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: cards[0],
              start: "top 88%",
              once: true,
            },
          });
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className={className} data-testid={testId}>
      {children}
    </section>
  );
}
