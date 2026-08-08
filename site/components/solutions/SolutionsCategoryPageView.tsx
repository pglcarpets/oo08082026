"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export interface SolutionsCategoryPageViewProps {
  categoryId?: string;
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  heroImage: string;
  heroImageAlt: string;
  productsHref: string;
  craftQuote: string;
  craftAttribution: string;
  bodyKicker: string;
  bodyTitle: string;
  bodyDescription: string;
  browseCta: string;
  allSolutionsCta: string;
  contactCta: string;
  deskKicker: string;
  deskTitle: string;
  deskDescription: string;
  deskPrimaryCta: string;
  deskSecondaryCta: string;
  deskTertiaryCta: string;
}

export function SolutionsCategoryPageView({
  categoryId,
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroPrimaryCta,
  heroSecondaryCta,
  heroImage,
  heroImageAlt,
  productsHref,
  craftQuote,
  craftAttribution,
  bodyKicker,
  bodyTitle,
  bodyDescription,
  browseCta,
  allSolutionsCta,
  contactCta,
  deskKicker,
  deskTitle,
  deskDescription,
  deskPrimaryCta,
  deskSecondaryCta,
  deskTertiaryCta,
}: SolutionsCategoryPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const overviewRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll(
        "[data-solutions-category-hero-reveal]",
      );
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

        const media = heroRef.current?.querySelector(".solutions-hero__media");
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
      if (gsapReducedMotion() || !overviewRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = overviewRef.current?.querySelectorAll("[data-solutions-category-reveal]");
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
            trigger: overviewRef.current,
            start: "top 82%",
            once: true,
          },
        });
      }, overviewRef);

      return () => ctx.revert();
    },
    { scope: overviewRef, dependencies: [bodyDescription] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="solutions-hero"
        aria-labelledby="solutions-category-hero-heading"
        data-testid="solutions-category-hero"
        data-category={categoryId}
      >
        <div className="solutions-hero__ambient" aria-hidden="true" />
        <div className="solutions-hero__media">
          <Image
            src={heroImage}
            alt={heroImageAlt}
            fill
            priority
            sizes="100vw"
            className="solutions-hero__img solutions-category-hero__img"
          />
        </div>
        <div className="solutions-hero__scrim" aria-hidden="true" />

        <div className="solutions-hero__layout">
          <div className="solutions-hero__copy">
            <p
              data-solutions-category-hero-reveal
              className="home-kicker solutions-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1
              id="solutions-category-hero-heading"
              className="solutions-hero__title"
            >
              <span data-solutions-category-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p
              data-solutions-category-hero-reveal
              className="solutions-hero__subtitle"
            >
              {heroSubtitle}
            </p>
            <div
              data-solutions-category-hero-reveal
              className="solutions-hero__actions flex flex-wrap gap-3"
            >
              <MarketingCtaLink
                href={productsHref}
                label={heroPrimaryCta}
                surface="solutions-category-hero"
                variant="primary"
                context="hero"
              >
                {heroPrimaryCta}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/solutions"
                label={heroSecondaryCta}
                surface="solutions-category-hero"
                variant="outline-light"
                context="hero"
              >
                {heroSecondaryCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section className="about-craft-strip scheme-accent-wash" aria-label="Category perspective">
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote className="about-craft-quote__text home-heading text-balance">
              {craftQuote}
            </blockquote>
            <figcaption className="about-craft-quote__attribution">
              {craftAttribution}
            </figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section
            ref={overviewRef}
            className="solutions-category-overview"
            data-testid="solutions-category-overview"
          >
            <div className="solutions-category-overview__media" data-solutions-category-reveal>
              <Image
                src={heroImage}
                alt={heroImageAlt}
                fill
                sizes="(min-width: 56rem) 52vw, 100vw"
                className="solutions-category-overview__img"
              />
            </div>
            <div className="solutions-category-overview__copy">
              <p data-solutions-category-reveal className="home-kicker">
                {bodyKicker}
              </p>
              <h2 data-solutions-category-reveal className="home-heading">
                {bodyTitle}
              </h2>
              <p data-solutions-category-reveal className="solutions-category-overview__lead">
                {bodyDescription}
              </p>
              <div data-solutions-category-reveal className="mt-6 flex flex-wrap gap-3">
                <MarketingCtaLink
                  href={productsHref}
                  label={browseCta}
                  surface="solutions-category-body"
                  variant="primary"
                >
                  {browseCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/solutions"
                  label={allSolutionsCta}
                  surface="solutions-category-body"
                  variant="outline"
                >
                  {allSolutionsCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/contact"
                  label={contactCta}
                  surface="solutions-category-body"
                  variant="outline"
                >
                  {contactCta}
                </MarketingCtaLink>
              </div>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={deskKicker}
            title={deskTitle}
            description={deskDescription}
            actions={[
              { href: "/contact", label: deskPrimaryCta, variant: "primary" },
              { href: "/planner", label: deskSecondaryCta, variant: "outline-light" },
              { href: "/solutions", label: deskTertiaryCta, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
