"use client";

import { MapPin, Clock, Phone } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { SHOWROOMS_HERO_IMAGE, SHOWROOMS_HERO_MEDIA } from "@/features/site/data/showroomsPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type VisitRow = {
  kind: "address" | "hours" | "phone";
  title: string;
  detail: string;
};

type Highlight = {
  title: string;
  detail: string;
};

const VISIT_ICONS = {
  address: MapPin,
  hours: Clock,
  phone: Phone,
} as const;

export interface ShowroomsPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  craftQuote: string;
  craftAttribution: string;
  visitKicker: string;
  visitTitle: string;
  visitCta: string;
  visitRows: readonly VisitRow[];
  highlightsKicker: string;
  highlightsTitle: string;
  highlights: readonly Highlight[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function ShowroomsPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  craftQuote,
  craftAttribution,
  visitKicker,
  visitTitle,
  visitCta,
  visitRows,
  highlightsKicker,
  highlightsTitle,
  highlights,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: ShowroomsPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-showrooms-hero-reveal]");
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

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !contentRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = contentRef.current?.querySelectorAll("[data-showrooms-reveal]");
        if (!targets?.length) {
          return;
        }

        gsap.from(targets, {
          y: GSAP_SCROLL_REVEAL.y,
          opacity: GSAP_SCROLL_REVEAL.opacity,
          duration: GSAP_SCROLL_REVEAL.duration,
          stagger: GSAP_SCROLL_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: contentRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, contentRef);

      return () => ctx.revert();
    },
    { scope: contentRef, dependencies: [motionReady] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="showrooms-hero"
        aria-labelledby="showrooms-hero-heading"
        data-testid="showrooms-hero"
      >
        <EditorialHeroMedia
          prefix="showrooms"
          image={SHOWROOMS_HERO_IMAGE}
          media={SHOWROOMS_HERO_MEDIA}
        />
        <div className="showrooms-hero__scrim" aria-hidden="true" />

        <div className="showrooms-hero__layout">
          <div className="showrooms-hero__copy">
            <p
              data-showrooms-hero-reveal
              className="home-kicker showrooms-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="showrooms-hero-heading" className="showrooms-hero__title">
              <span data-showrooms-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-showrooms-hero-reveal className="showrooms-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-showrooms-hero-reveal className="showrooms-hero__actions">
              <MarketingCtaLink
                href="/contact"
                label={visitCta}
                surface="showrooms-hero"
                variant="primary"
                context="hero"
              >
                {visitCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="about-craft-strip scheme-accent-wash" aria-label="Showroom perspective">
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote className="about-craft-quote__text home-heading text-balance">
              {craftQuote}
            </blockquote>
            <figcaption className="about-craft-quote__attribution">{craftAttribution}</figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section
            ref={contentRef}
            className="showrooms-content"
            data-testid="showrooms-content"
          >
            <div className="showrooms-content__visit">
              <p data-showrooms-reveal className="home-kicker">
                {visitKicker}
              </p>
              <h2 data-showrooms-reveal className="home-heading mt-3 mb-6">
                {visitTitle}
              </h2>
              <ul className="showrooms-visit-list">
                {visitRows.map((row) => {
                  const Icon = VISIT_ICONS[row.kind];
                  return (
                    <li key={row.title} data-showrooms-reveal className="showrooms-visit-row">
                      <Icon className="showrooms-visit-row__icon" aria-hidden="true" />
                      <div>
                        <p className="showrooms-visit-row__title">{row.title}</p>
                        <p className="showrooms-visit-row__detail">{row.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div data-showrooms-reveal className="mt-6">
                <MarketingCtaLink
                  href="/contact"
                  label={visitCta}
                  surface="showrooms-visit"
                  variant="primary"
                >
                  {visitCta}
                </MarketingCtaLink>
              </div>
            </div>

            <div className="showrooms-content__highlights">
              <p data-showrooms-reveal className="home-kicker">
                {highlightsKicker}
              </p>
              <h2 data-showrooms-reveal className="home-heading mt-3 mb-6">
                {highlightsTitle}
              </h2>
              <div className="showrooms-highlights">
                {highlights.map((item) => (
                  <article key={item.title} data-showrooms-reveal className="showrooms-highlight">
                    <h3 className="showrooms-highlight__title home-why-card__title">
                      {item.title}
                    </h3>
                    <p className="showrooms-highlight__detail">{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={ctaKicker}
            title={
              <>
                {ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{ctaTitleAccent}</span>
              </>
            }
            description={ctaDescription}
            actions={[
              { href: "/contact", label: ctaPrimary, variant: "primary" },
              { href: "/planning", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
