"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type LegalBodyRevealProps = {
  children: ReactNode;
  className?: string;
};

/** Scroll-reveal wrapper for legal layout columns (privacy / terms / refund). */
export function LegalBodyReveal({ children, className }: LegalBodyRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !rootRef.current) {
        return;
      }

      const targets = rootRef.current.querySelectorAll("[data-legal-reveal]");
      if (!targets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 84%",
            once: true,
          },
        });
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef, dependencies: [motionReady] },
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
