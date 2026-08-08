"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { AboutHeroMedia } from "@/components/about/AboutHeroMedia";
import { ABOUT_STORY_IMAGE } from "@/features/site/data/aboutPage";
import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type AboutPillar = { title: string; detail: string };
type AboutProcessStep = { title: string; detail: string };

export interface AboutPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroCta: string;
  storyKicker: string;
  storyTitleLead: string;
  storyTitleAccent: string;
  storyLead: string;
  craftQuote: string;
  craftAttribution: string;
  pillarsKicker: string;
  pillars: AboutPillar[];
  processKicker: string;
  processTitleLead: string;
  processTitleAccent: string;
  processSteps: AboutProcessStep[];
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

/** Signature beat only â€” craft pull-quote reveal (hero has its own entrance). */
function useCraftReveal(sectionRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = sectionRef.current?.querySelectorAll("[data-about-craft-reveal]");
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
            trigger: sectionRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef },
  );
}

/** Quiet editorial reveals for the body sections. */
function useBodyReveal(scopeRef: RefObject<HTMLDivElement | null>) {
  useGSAP(
    () => {
      if (gsapReducedMotion() || !scopeRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const groups = Array.from(
          scopeRef.current?.querySelectorAll<HTMLElement>("[data-about-reveal-group]") ?? [],
        );

        for (const group of groups) {
          const targets = group.querySelectorAll("[data-about-scroll-reveal]");
          if (!targets.length) {
            continue;
          }

          gsap.from(targets, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: group,
              start: "top 84%",
              once: true,
            },
          });
        }
      }, scopeRef);

      return () => ctx.revert();
    },
    { scope: scopeRef },
  );
}

export function AboutPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroCta,
  storyKicker,
  storyTitleLead,
  storyTitleAccent,
  storyLead,
  craftQuote,
  craftAttribution,
  pillarsKicker,
  pillars,
  processKicker,
  processTitleLead,
  processTitleAccent,
  processSteps,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: AboutPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-about-hero-reveal]");
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

  useCraftReveal(craftRef);
  useBodyReveal(bodyRef);

  return (
    <>
      <section
        ref={heroRef}
        className="about-hero"
        aria-labelledby="about-hero-heading"
        data-testid="about-hero"
      >
        <AboutHeroMedia />
        <div className="about-hero__scrim" aria-hidden="true" />

        <div className="about-hero__layout">
          <div className="about-hero__copy">
            <p
              data-about-hero-reveal
              className="home-kicker about-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1
              id="about-hero-heading"
              className="home-hero-title-route about-hero__title text-inverse text-start"
            >
              <span data-about-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-about-hero-reveal className="about-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-about-hero-reveal className="about-hero__actions">
              <MarketingCtaLink
                href="/clients"
                label={heroCta}
                surface="about-hero"
                variant="primary"
                context="hero"
              >
                {heroCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <div ref={bodyRef}>
        <HomeSection variant="soft" spacing="sm" className="border-t-0">
          <HomeSectionInner>
            <section
              className="about-story"
              data-testid="about-story"
              data-about-reveal-group
            >
              <div className="about-story__media" data-about-scroll-reveal>
                <Image
                  src={ABOUT_STORY_IMAGE.src}
                  alt={ABOUT_STORY_IMAGE.alt}
                  fill
                  priority
                  sizes="(min-width: 56rem) 52vw, 100vw"
                  className="about-story__img"
                />
              </div>
              <div className="about-story__copy" data-about-scroll-reveal>
                <p className="home-kicker">{storyKicker}</p>
                <h2 className="home-heading">
                  {storyTitleLead}{" "}
                  <span className="text-accent-italic">{storyTitleAccent}</span>
                </h2>
                <p className="about-story__lead">{storyLead}</p>
              </div>
            </section>
          </HomeSectionInner>
        </HomeSection>

        <section
          ref={craftRef}
          className="about-craft-strip"
          aria-label="Craft perspective"
          data-testid="about-craft"
        >
          <div className="home-shell-xl about-craft-strip__inner">
            <figure className="about-craft-quote">
              <span
                data-about-craft-reveal
                className="about-craft-quote__rule"
                aria-hidden="true"
              />
              <blockquote
                data-about-craft-reveal
                className="about-craft-quote__text home-heading text-balance"
              >
                {craftQuote}
              </blockquote>
              <figcaption data-about-craft-reveal className="about-craft-quote__attribution">
                {craftAttribution}
              </figcaption>
            </figure>
          </div>
        </section>

        <HomeSection variant="white" spacing="md" className="border-t-0">
          <HomeSectionInner>
            <section className="about-pillars-section" data-about-reveal-group>
              <p className="home-kicker mb-6 md:mb-8" data-about-scroll-reveal>
                {pillarsKicker}
              </p>
              <div className="about-pillars">
                {pillars.map((pillar) => (
                  <article key={pillar.title} className="about-pillar" data-about-scroll-reveal>
                    <h3 className="about-pillar__title home-why-card__title">{pillar.title}</h3>
                    <p className="about-pillar__detail">{pillar.detail}</p>
                  </article>
                ))}
              </div>
            </section>
          </HomeSectionInner>
        </HomeSection>

        <HomeSection variant="soft" spacing="md" borderY>
          <HomeSectionInner>
            <section className="about-process" data-about-reveal-group>
              <div data-about-scroll-reveal>
                <p className="home-kicker">{processKicker}</p>
                <h2 className="home-heading mt-3">
                  {processTitleLead}{" "}
                  <span className="text-accent-italic">{processTitleAccent}</span>
                </h2>
              </div>
              <ol className="about-process__steps">
                {processSteps.map((step) => (
                  <li key={step.title} className="about-process__step" data-about-scroll-reveal>
                    <h3 className="about-process__step-title home-why-card__title text-strong">
                      {step.title}
                    </h3>
                    <p className="about-process__step-detail">{step.detail}</p>
                  </li>
                ))}
              </ol>
            </section>
          </HomeSectionInner>
        </HomeSection>

        <section
          className="about-cta-ink"
          aria-labelledby="about-cta-heading"
          data-testid="about-cta"
          data-about-reveal-group
        >
          <div className="home-shell-xl about-cta-ink__inner">
            <div className="about-cta-ink__copy" data-about-scroll-reveal>
              {ctaKicker ? <p className="typ-label text-inverse-muted">{ctaKicker}</p> : null}
              <h2 id="about-cta-heading" className="home-heading mt-4 text-inverse">
                {ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{ctaTitleAccent}</span>
              </h2>
              <p className="page-copy text-inverse-body mt-4 max-w-xl">{ctaDescription}</p>
            </div>
            <div className="about-cta-ink__actions" data-about-scroll-reveal>
              <MarketingCtaLink
                href="/contact"
                label={ctaPrimary}
                surface="about-cta"
                variant="primary"
                context="hero"
                className="w-full justify-center sm:w-auto"
              >
                {ctaPrimary}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/clients"
                label={ctaSecondary}
                surface="about-cta"
                variant="outline-light"
                context="hero"
                className="w-full justify-center sm:w-auto"
              >
                {ctaSecondary}
              </MarketingCtaLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
