"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { TRUSTED_BY_STATS } from "@/features/site/data/proof";
import {
  TRUSTED_BY_HERO_IMAGE,
  TRUSTED_BY_HERO_MEDIA,
  TRUSTED_BY_PALETTE_SWATCHES,
} from "@/features/site/data/trustedByPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export interface TrustedByPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  overviewKicker: string;
  overviewTitle: string;
  overviewDescription: string;
  statsKicker: string;
  craftQuote: string;
  craftAttribution: string;
  paletteKicker: string;
  paletteTitle: string;
  paletteDescription: string;
  quotesKicker: string;
  quotesTitle: string;
  quotes: readonly { quote: string; attribution: string }[];
  sectors: readonly string[];
  sectorsKicker: string;
  sectorsTitle: string;
  sectorsDescription: string;
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function TrustedByPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  overviewKicker,
  overviewTitle,
  overviewDescription,
  statsKicker,
  craftQuote,
  craftAttribution,
  paletteKicker,
  paletteTitle,
  paletteDescription,
  quotesKicker,
  quotesTitle,
  quotes,
  sectors,
  sectorsKicker,
  sectorsTitle,
  sectorsDescription,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: TrustedByPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const paletteRef = useRef<HTMLElement>(null);
  const quotesRef = useRef<HTMLElement>(null);
  const sectorsRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-trusted-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".trusted-by-hero__media");
        if (media) {
          gsap.to(media, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: heroRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
            },
          });
        }
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef, dependencies: [motionReady] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !storyRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = storyRef.current?.querySelectorAll("[data-trusted-reveal]");
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
            trigger: storyRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, storyRef);

      return () => ctx.revert();
    },
    { scope: storyRef },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !paletteRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = paletteRef.current?.querySelectorAll("[data-trusted-reveal]");
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
            trigger: paletteRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, paletteRef);

      return () => ctx.revert();
    },
    { scope: paletteRef },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !quotesRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = quotesRef.current?.querySelectorAll("[data-trusted-reveal]");
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
            trigger: quotesRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, quotesRef);

      return () => ctx.revert();
    },
    { scope: quotesRef, dependencies: [quotes] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectorsRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = sectorsRef.current?.querySelectorAll("[data-trusted-reveal]");
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
            trigger: sectorsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, sectorsRef);

      return () => ctx.revert();
    },
    { scope: sectorsRef, dependencies: [sectors] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="trusted-by-hero"
        aria-labelledby="trusted-by-hero-heading"
        data-testid="trusted-by-hero"
      >
        <EditorialHeroMedia
          prefix="trusted-by"
          image={TRUSTED_BY_HERO_IMAGE}
          media={TRUSTED_BY_HERO_MEDIA}
        />
        <div className="trusted-by-hero__scrim" aria-hidden="true" />

        <div className="trusted-by-hero__layout">
          <div className="trusted-by-hero__copy">
            <p
              data-trusted-hero-reveal
              className="home-kicker trusted-by-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="trusted-by-hero-heading" className="trusted-by-hero__title">
              <span data-trusted-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-trusted-hero-reveal className="trusted-by-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-trusted-hero-reveal className="trusted-by-hero__actions">
              <MarketingCtaLink
                href="/clients"
                label={ctaSecondary}
                surface="trusted-by-hero"
                variant="primary"
                context="hero"
              >
                {ctaSecondary}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-kpi-band" role="group" aria-label={statsKicker}>
        <div className="home-shell-xl proof-kpi-band__grid">
          {TRUSTED_BY_STATS.map((item) => (
            <div key={item.label} className="proof-kpi-band__item">
              <p className="proof-kpi-band__value">{item.value}</p>
              <p className="proof-kpi-band__label">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={storyRef} className="trusted-by-story" data-testid="trusted-by-story">
            <div className="trusted-by-story__copy">
              <p data-trusted-reveal className="home-kicker">
                {overviewKicker}
              </p>
              <h2 data-trusted-reveal className="home-heading">
                {overviewTitle}
              </h2>
              <p data-trusted-reveal className="trusted-by-story__lead">
                {overviewDescription}
              </p>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <section className="about-craft-strip scheme-accent-wash" aria-label="Trust perspective">
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
          <section ref={paletteRef} className="trusted-by-palette" data-testid="trusted-by-palette">
            <p data-trusted-reveal className="home-kicker">
              {paletteKicker}
            </p>
            <h2 data-trusted-reveal className="home-heading mt-3 mb-4 max-w-2xl">
              {paletteTitle}
            </h2>
            <p data-trusted-reveal className="page-copy text-body max-w-2xl">
              {paletteDescription}
            </p>
            <div className="trusted-by-palette__swatches" aria-label="Oando material palette">
              {TRUSTED_BY_PALETTE_SWATCHES.map((swatch) => (
                <figure key={swatch.label} data-trusted-reveal className="trusted-by-swatch">
                  <span
                    className="trusted-by-swatch__plate"
                    style={{ background: `var(${swatch.token}, ${swatch.hex})` }}
                    aria-hidden="true"
                  />
                  <figcaption className="trusted-by-swatch__label">{swatch.label}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <section
        ref={quotesRef}
        className="clients-trust-strip scheme-accent-wash"
        aria-label="Delivery quotes"
        data-testid="trusted-by-quotes"
      >
        <div className="home-shell-xl">
          <p data-trusted-reveal className="home-kicker">
            {quotesKicker}
          </p>
          <h2 data-trusted-reveal className="home-heading mt-3 mb-8">
            {quotesTitle}
          </h2>
          <div className="clients-pull-quotes">
            {quotes.map((item) => (
              <figure key={item.attribution} data-trusted-reveal className="clients-pull-quote">
                <blockquote className="clients-pull-quote__text home-heading text-balance">
                  {item.quote}
                </blockquote>
                <figcaption className="clients-pull-quote__attribution">{item.attribution}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section ref={sectorsRef} className="trusted-by-sectors" data-testid="trusted-by-sectors">
            <p data-trusted-reveal className="home-kicker">
              {sectorsKicker}
            </p>
            <h2 data-trusted-reveal className="home-heading mt-3 mb-4 max-w-xl">
              {sectorsTitle}
            </h2>
            <p data-trusted-reveal className="page-copy text-body max-w-xl">
              {sectorsDescription}
            </p>
            <ul className="trusted-by-sectors__list" >
              {sectors.map((sector) => (
                <li key={sector} data-trusted-reveal className="trusted-by-sector-row">
                  {sector}
                </li>
              ))}
            </ul>
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
              { href: "/clients", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
