"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export type SitemapSection = {
  heading: string;
  links: readonly { href: string; label: string }[];
};

export interface SitemapPageViewProps {
  kicker: string;
  title: string;
  subtitle: string;
  sections: readonly SitemapSection[];
}

export function SitemapPageView({ kicker, title, subtitle, sections }: SitemapPageViewProps) {
  const headerRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
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

      const revealTargets = headerRef.current.querySelectorAll("[data-sitemap-hero-reveal]");
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

  useGSAP(
    () => {
      if (gsapReducedMotion() || !gridRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = gridRef.current?.querySelectorAll("[data-sitemap-reveal]");
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
            trigger: gridRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, gridRef);

      return () => ctx.revert();
    },
    { scope: gridRef, dependencies: [sections] },
  );

  return (
    <div className="sitemap-page">
      <header
        ref={headerRef}
        className="sitemap-header"
        aria-labelledby="sitemap-heading"
        data-testid="sitemap-header"
      >
        <div className="home-shell-xl sitemap-header__inner">
          <div
            data-sitemap-hero-reveal
            className="sitemap-header__bronze-mark"
            aria-hidden="true"
            data-testid="sitemap-bronze-mark"
          />
          <p data-sitemap-hero-reveal className="typ-label text-contrast-accent">
            {kicker}
          </p>
          <h1 id="sitemap-heading" data-sitemap-hero-reveal className="typ-page-title sitemap-header__title">
            {title}
          </h1>
          <p data-sitemap-hero-reveal className="typ-body sitemap-header__copy text-body">
            {subtitle}
          </p>
        </div>
      </header>

      <div className="sitemap-bronze-rule" aria-hidden="true">
        <div className="home-shell-xl" />
      </div>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <div ref={gridRef} className="sitemap-grid" data-testid="sitemap-grid">
            {sections.map((section) => {
              const headingId = `sitemap-${section.heading.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <nav
                  key={section.heading}
                  aria-labelledby={headingId}
                  data-sitemap-reveal
                  className="sitemap-section"
                >
                  <h2 id={headingId} className="typ-nav sitemap-section__title">
                    {section.heading}
                  </h2>
                  <ul className="sitemap-section__links">
                    {section.links.map((link) => (
                      <li key={`${section.heading}-${link.href}-${link.label}`}>
                        <Link
                          href={link.href}
                          className="sitemap-section__link typ-body-sm"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              );
            })}
          </div>
        </HomeSectionInner>
      </HomeSection>
    </div>
  );
}
