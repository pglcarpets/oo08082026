"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type ClientsProofItem = {
  id: string;
  value: string;
  label: string;
};

type ClientsProofStripProps = {
  items: readonly ClientsProofItem[];
  asOfLabel: string;
};

/** Signature beat — proof metrics stagger on scroll (not a KPI wall bounce). */
export function ClientsProofStrip({ items, asOfLabel }: ClientsProofStripProps) {
  const stripRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !stripRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = stripRef.current?.querySelectorAll("[data-clients-proof-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          scrollTrigger: {
            trigger: stripRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, stripRef);

      return () => ctx.revert();
    },
    { scope: stripRef },
  );

  return (
    <section
      ref={stripRef}
      className="clients-proof-strip"
      aria-label="Delivery proof metrics"
    >
      <div className="home-shell-xl clients-proof-strip__inner">
        <span
          data-clients-proof-reveal
          className="clients-proof-strip__rule"
          aria-hidden="true"
        />
        <dl className="clients-proof-strip__list">
          {items.map((stat) => (
            <div
              key={stat.id}
              data-clients-proof-reveal
              className="clients-proof-strip__item"
            >
              <dt className="clients-proof-strip__label">{stat.label}</dt>
              <dd
                data-testid={`kpi-${stat.id}-clients`}
                className="clients-proof-strip__value"
              >
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
        <p
          data-clients-proof-reveal
          data-testid="kpi-as-of-clients"
          className="clients-proof-strip__as-of"
        >
          {asOfLabel}
        </p>
      </div>
    </section>
  );
}
