"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  PLANNING_HERO_IMAGE,
  PLANNING_HERO_MEDIA,
} from "@/features/site/data/planningPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type PlanningStep = { title: string; detail: string };

export interface PlanningPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  craftQuote: string;
  craftAttribution: string;
  primaryCta: string;
  plannerCta: string;
  tertiaryCta: string;
  workflowKicker: string;
  workflowTitle: string;
  steps: readonly PlanningStep[];
  deliverablesKicker: string;
  deliverablesTitle: string;
  deliverables: readonly string[];
  bestForKicker: string;
  bestForDescription: string;
  deskKicker: string;
  deskTitle: string;
  deskDescription: string;
}

function useScrollReveal(
  sectionRef: RefObject<HTMLElement | null>,
  selector: string,
  dependencies: unknown[] = [],
) {
  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = sectionRef.current?.querySelectorAll(selector);
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
    { scope: sectionRef, dependencies },
  );
}

export function PlanningPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  craftQuote,
  craftAttribution,
  primaryCta,
  plannerCta,
  tertiaryCta,
  workflowKicker,
  workflowTitle,
  steps,
  deliverablesKicker,
  deliverablesTitle,
  deliverables,
  bestForKicker,
  bestForDescription,
  deskKicker,
  deskTitle,
  deskDescription,
}: PlanningPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const workflowRef = useRef<HTMLElement>(null);
  const deliverablesRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-planning-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".planning-hero__media");
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
      const quoteBits = craftRef.current.querySelectorAll("[data-planning-craft-reveal]");
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

  useScrollReveal(workflowRef, "[data-planning-workflow-reveal]", [steps]);
  useScrollReveal(deliverablesRef, "[data-planning-deliverables-reveal]", [deliverables]);

  return (
    <>
      <section
        ref={heroRef}
        className="planning-hero"
        aria-labelledby="planning-hero-heading"
        data-testid="planning-hero"
      >
        <EditorialHeroMedia
          prefix="planning"
          image={PLANNING_HERO_IMAGE}
          media={PLANNING_HERO_MEDIA}
        />
        <div className="planning-hero__scrim" aria-hidden="true" />

        <div className="planning-hero__layout">
          <div className="planning-hero__copy">
            <p
              data-planning-hero-reveal
              className="home-kicker planning-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="planning-hero-heading" className="planning-hero__title">
              <span data-planning-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-planning-hero-reveal className="planning-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-planning-hero-reveal className="planning-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href="/contact"
                label={primaryCta}
                surface="planning-hero"
                variant="primary"
                context="hero"
              >
                {primaryCta}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/ooplanner"
                label={plannerCta}
                surface="planning-hero"
                variant="outline-light"
                context="hero"
              >
                {plannerCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={craftRef}
        className="about-craft-strip scheme-accent-wash"
        aria-label="Planning perspective"
      >
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote
              data-planning-craft-reveal
              className="about-craft-quote__text home-heading text-balance"
            >
              {craftQuote}
            </blockquote>
            <figcaption data-planning-craft-reveal className="about-craft-quote__attribution">
              {craftAttribution}
            </figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={workflowRef} className="about-process" data-testid="planning-workflow">
            <div>
              <p data-planning-workflow-reveal className="home-kicker">
                {workflowKicker}
              </p>
              <h2 data-planning-workflow-reveal className="home-heading mt-3">
                {workflowTitle}
              </h2>
            </div>
            <ol className="about-process__steps">
              {steps.map((step) => (
                <li
                  key={step.title}
                  data-planning-workflow-reveal
                  className="about-process__step"
                >
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

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section
            ref={deliverablesRef}
            className="planning-deliverables"
            data-testid="planning-deliverables"
          >
            <div className="planning-deliverables__intro">
              <p data-planning-deliverables-reveal className="home-kicker">
                {deliverablesKicker}
              </p>
              <h2 data-planning-deliverables-reveal className="home-heading mt-3">
                {deliverablesTitle}
              </h2>
              <p data-planning-deliverables-reveal className="planning-best-for">
                <span className="typ-label text-body">{bestForKicker}</span>
                <span className="planning-best-for__copy">{bestForDescription}</span>
              </p>
            </div>

            <ul className="planning-deliverables__list">
              {deliverables.map((item) => (
                <li key={item} data-planning-deliverables-reveal className="planning-deliverables__item">
                  {item}
                </li>
              ))}
            </ul>
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
              { href: "/downloads", label: tertiaryCta, variant: "outline-light" },
              { href: "/contact", label: primaryCta, variant: "primary" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
