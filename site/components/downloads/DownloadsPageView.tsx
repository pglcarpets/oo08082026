"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteActionCard } from "@/components/shared/RouteActionCard";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { SITE_CONTACT, buildWhatsAppHref } from "@/features/site/data/contact";
import {
  DOWNLOADS_CRAFT,
  DOWNLOADS_HERO_IMAGE,
  DOWNLOADS_HERO_MEDIA,
} from "@/features/site/data/downloadsPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type ResourceCategory = {
  title: string;
  detail: string;
  cta: string;
  href: string;
};

type ProcessStep = { title: string; detail: string };

export interface DownloadsPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  resourceKicker: string;
  resourceTitle: string;
  resourceDescription: string;
  resources: readonly ResourceCategory[];
  processKicker: string;
  processTitle: string;
  processSteps: readonly ProcessStep[];
  noteTitle: string;
  noteBody: string;
  notePoints: readonly string[];
  urgentKicker: string;
  urgentDescription: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
}

export function DownloadsPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroPrimaryCta,
  resourceKicker,
  resourceTitle,
  resourceDescription,
  resources,
  processKicker,
  processTitle,
  processSteps,
  noteTitle,
  noteBody,
  notePoints,
  urgentKicker,
  urgentDescription,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
}: DownloadsPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const resourcesRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-downloads-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".downloads-hero__media");
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

  /* Signature beat: bronze rule draws in, then craft quote settles. */
  useGSAP(
    () => {
      if (gsapReducedMotion() || !craftRef.current) {
        return;
      }

      const rule = craftRef.current.querySelector(".about-craft-quote__rule");
      const quoteBits = craftRef.current.querySelectorAll("[data-downloads-craft-reveal]");
      if (!rule || !quoteBits.length) {
        return;
      }

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: craftRef.current,
            start: "top 88%",
            once: true,
          },
        });
        gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });
        tl.to(rule, {
          scaleX: 1,
          duration: 0.55,
          ease: GSAP_EASE_OUT,
        }).from(
          quoteBits,
          {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: 0.08,
            ease: GSAP_EASE_OUT,
          },
          "-=0.25",
        );
      }, craftRef);

      return () => ctx.revert();
    },
    { scope: craftRef },
  );

  useGSAP(
    () => {
      if (gsapReducedMotion() || !resourcesRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = resourcesRef.current?.querySelectorAll("[data-downloads-reveal]");
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
            trigger: resourcesRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, resourcesRef);

      return () => ctx.revert();
    },
    { scope: resourcesRef, dependencies: [resources] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="downloads-hero"
        aria-labelledby="downloads-hero-heading"
        data-testid="downloads-hero"
      >
        <EditorialHeroMedia
          prefix="downloads"
          image={DOWNLOADS_HERO_IMAGE}
          media={DOWNLOADS_HERO_MEDIA}
        />
        <div className="downloads-hero__scrim" aria-hidden="true" />

        <div className="downloads-hero__layout">
          <div className="downloads-hero__copy">
            <p
              data-downloads-hero-reveal
              className="home-kicker downloads-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="downloads-hero-heading" className="downloads-hero__title">
              <span data-downloads-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-downloads-hero-reveal className="downloads-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-downloads-hero-reveal className="downloads-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href="/contact"
                label={heroPrimaryCta}
                surface="downloads-hero"
                variant="primary"
                context="hero"
              >
                {heroPrimaryCta}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/planning"
                label="Planning support"
                surface="downloads-hero"
                variant="outline-light"
                context="hero"
              >
                Planning support
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={craftRef}
        className="about-craft-strip scheme-accent-wash"
        aria-label="Resource Desk perspective"
      >
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote
              data-downloads-craft-reveal
              className="about-craft-quote__text home-heading text-balance"
            >
              {DOWNLOADS_CRAFT.quote}
            </blockquote>
            <figcaption data-downloads-craft-reveal className="about-craft-quote__attribution">
              {DOWNLOADS_CRAFT.attribution}
            </figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={resourcesRef} data-testid="downloads-resources">
            <p data-downloads-reveal className="home-kicker mb-6 md:mb-8">
              {resourceKicker}
            </p>
            <h2 data-downloads-reveal className="home-heading mb-4 max-w-3xl">
              {resourceTitle}
            </h2>
            <p data-downloads-reveal className="page-copy text-body mb-8 max-w-2xl">
              {resourceDescription}
            </p>

            <div className="downloads-resources">
              {resources.map((item) => (
                <article key={item.title} data-downloads-reveal className="downloads-resource">
                  <h3 className="downloads-resource__title home-why-card__title">{item.title}</h3>
                  <p className="downloads-resource__detail">{item.detail}</p>
                  <MarketingCtaLink
                    href={item.href}
                    label={item.cta}
                    surface="downloads-resource-row"
                    variant="outline"
                    className="justify-self-start"
                  >
                    {item.cta}
                  </MarketingCtaLink>
                </article>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section
            className="downloads-process marketing-cta-band scheme-panel-dark scheme-border rounded-2xl border p-6 md:p-8"
            data-section="route-cta"
            data-testid="downloads-process"
          >
            <div>
              <p className="home-kicker text-[color:var(--color-bronze-300)]">{processKicker}</p>
              <h2 className="home-heading mt-3 mb-4 text-inverse">{processTitle}</h2>
            </div>
            <ol className="downloads-process__steps">
              {processSteps.map((step, index) => (
                <li key={step.title} className="downloads-process__step">
                  <span className="downloads-process__index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="downloads-process__title home-why-card__title">{step.title}</h3>
                  <p className="downloads-process__detail">{step.detail}</p>
                </li>
              ))}
            </ol>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md">
        <HomeSectionInner>
          <article className="downloads-note" data-testid="downloads-note">
            <p className="home-kicker">{noteTitle}</p>
            <p className="page-copy text-body mt-4 max-w-2xl">{noteBody}</p>
            <ul className="downloads-note__points">
              {notePoints.map((point) => (
                <li key={point} className="downloads-note__point">
                  <span className="downloads-note__bullet" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>

          <RouteActionCard
            kicker={urgentKicker}
            title={resourceTitle}
            description={urgentDescription}
            className="mt-10 p-6 md:p-8"
            actions={[
              { href: "/contact", label: primaryCta, variant: "primary" },
              { href: `mailto:${SITE_CONTACT.salesEmail}`, label: secondaryCta },
              {
                href: buildWhatsAppHref(
                  "Hi, I need a product catalog or technical sheet pack for my workspace project.",
                ),
                label: tertiaryCta,
              },
            ]}
          />
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
              { href: "/contact", label: primaryCta, variant: "primary" },
              { href: "/planning", label: "Open planning", variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
