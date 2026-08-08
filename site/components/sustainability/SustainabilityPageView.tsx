"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  SUSTAINABILITY_HERO_IMAGE,
  SUSTAINABILITY_HERO_MEDIA,
  SUSTAINABILITY_STORY_IMAGE,
} from "@/features/site/data/sustainabilityPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type SustainabilityPillar = { title: string; detail: string };
type SustainabilityEcoItem = { index: string; title: string; detail: string };

export interface SustainabilityPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCta: string;
  craftQuote: string;
  craftAttribution: string;
  commitmentsKicker: string;
  commitmentsTitle: string;
  commitments: readonly SustainabilityPillar[];
  introKicker: string;
  introTitleLeadShort: string;
  introTitleAccent: string;
  introDescription: string;
  introPoints: readonly string[];
  ecoScoreTitle: string;
  ecoScoreDescription: string;
  ecoScoreItems: readonly SustainabilityEcoItem[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

export function SustainabilityPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroCta,
  craftQuote,
  craftAttribution,
  commitmentsKicker,
  commitmentsTitle,
  commitments,
  introKicker,
  introTitleLeadShort,
  introTitleAccent,
  introDescription,
  introPoints,
  ecoScoreTitle,
  ecoScoreDescription,
  ecoScoreItems,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: SustainabilityPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const commitmentsRef = useRef<HTMLElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const ecoRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-sustainability-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".sustainability-hero__media");
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
      if (gsapReducedMotion() || !commitmentsRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = commitmentsRef.current?.querySelectorAll("[data-sustainability-reveal]");
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
            trigger: commitmentsRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, commitmentsRef);

      return () => ctx.revert();
    },
    { scope: commitmentsRef, dependencies: [commitments] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !storyRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = storyRef.current?.querySelectorAll("[data-sustainability-reveal]");
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
    { scope: storyRef, dependencies: [introPoints] },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !ecoRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = ecoRef.current?.querySelectorAll("[data-sustainability-reveal]");
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
            trigger: ecoRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, ecoRef);

      return () => ctx.revert();
    },
    { scope: ecoRef, dependencies: [ecoScoreItems] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="sustainability-hero"
        aria-labelledby="sustainability-hero-heading"
        data-testid="sustainability-hero"
      >
        <EditorialHeroMedia
          prefix="sustainability"
          image={SUSTAINABILITY_HERO_IMAGE}
          media={SUSTAINABILITY_HERO_MEDIA}
        />
        <div className="sustainability-hero__scrim" aria-hidden="true" />

        <div className="sustainability-hero__layout">
          <div className="sustainability-hero__copy">
            <p
              data-sustainability-hero-reveal
              className="home-kicker sustainability-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="sustainability-hero-heading" className="sustainability-hero__title">
              <span data-sustainability-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-sustainability-hero-reveal className="sustainability-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-sustainability-hero-reveal className="sustainability-hero__actions">
              <MarketingCtaLink
                href="/products"
                label={heroCta}
                surface="sustainability-hero"
                variant="primary"
                context="hero"
              >
                {heroCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="about-craft-strip scheme-accent-wash" aria-label="Sustainability perspective">
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
          <section ref={commitmentsRef} data-testid="sustainability-commitments">
            <p data-sustainability-reveal className="home-kicker mb-6 md:mb-8">
              {commitmentsKicker}
            </p>
            <h2 data-sustainability-reveal className="home-heading mb-8 max-w-3xl">
              {commitmentsTitle}
            </h2>
            <div className="sustainability-pillars">
              {commitments.map((pillar) => (
                <article key={pillar.title} data-sustainability-reveal className="sustainability-pillar">
                  <h3 className="sustainability-pillar__title home-why-card__title">{pillar.title}</h3>
                  <p className="sustainability-pillar__detail">{pillar.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section ref={storyRef} className="sustainability-story" data-testid="sustainability-story">
            <div className="sustainability-story__media" data-sustainability-reveal>
              <Image
                src={SUSTAINABILITY_STORY_IMAGE.src}
                alt={SUSTAINABILITY_STORY_IMAGE.alt}
                fill
                sizes="(min-width: 56rem) 52vw, 100vw"
                className="sustainability-story__img"
              />
            </div>
            <div className="sustainability-story__copy">
              <p data-sustainability-reveal className="home-kicker">
                {introKicker}
              </p>
              <h2 data-sustainability-reveal className="home-heading">
                {introTitleLeadShort}{" "}
                <span className="text-accent-italic">{introTitleAccent}</span>
              </h2>
              <p data-sustainability-reveal className="sustainability-story__lead">
                {introDescription}
              </p>
              <ul className="sustainability-story__points">
                {introPoints.map((point) => (
                  <li key={point} data-sustainability-reveal className="sustainability-story__point">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md">
        <HomeSectionInner>
          <section ref={ecoRef} className="sustainability-eco" data-testid="sustainability-eco">
            <div>
              <p data-sustainability-reveal className="home-kicker">
                Eco-Score
              </p>
              <h2 data-sustainability-reveal className="home-heading mt-3">
                {ecoScoreTitle}
              </h2>
              <p data-sustainability-reveal className="sustainability-eco__lead">
                {ecoScoreDescription}
              </p>
            </div>
            <ol className="sustainability-eco__steps">
              {ecoScoreItems.map((item) => (
                <li key={item.title} data-sustainability-reveal className="sustainability-eco__step">
                  <span className="sustainability-eco__index" aria-hidden="true">
                    {item.index}
                  </span>
                  <div>
                    <h3 className="sustainability-eco__step-title home-why-card__title text-strong">
                      {item.title}
                    </h3>
                    <p className="sustainability-eco__step-detail">{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
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
              { href: "/products", label: ctaPrimary, variant: "primary" },
              { href: "/contact", label: ctaSecondary, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
