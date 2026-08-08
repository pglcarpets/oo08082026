"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { JobCard } from "@/components/career/JobCard";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { CAREER_HERO_IMAGE, CAREER_HERO_MEDIA } from "@/features/site/data/careerPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type CareerPillar = { title: string; detail: string };
type CareerProcessStep = { title: string; detail: string };
type CareerJob = { title: string; department: string; location: string };

export interface CareerPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  craftQuote: string;
  craftAttribution: string;
  introKicker: string;
  introTitle: string;
  introDescription: string;
  pillars: readonly CareerPillar[];
  processKicker: string;
  processTitle: string;
  processDescription: string;
  processSteps: readonly CareerProcessStep[];
  openingsTitle: string;
  openingsAvailableTemplate: string;
  jobs: readonly CareerJob[];
  fallbackTitle: string;
  fallbackDescription: string;
  careersEmail: string;
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

/** Quiet hero entrance + still parallax â€” signature beat is the openings cascade below. */
function useHeroEntrance(heroRef: RefObject<HTMLElement | null>, motionReady: boolean) {
  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !heroRef.current) {
        return;
      }

      const revealTargets = heroRef.current.querySelectorAll("[data-career-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".career-hero__media");
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
}

/** Quiet craft strip settle â€” openings cascade stays the signature beat. */
function useCraftReveal(sectionRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = sectionRef.current?.querySelectorAll("[data-career-craft-reveal]");
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

export function CareerPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  craftQuote,
  craftAttribution,
  introKicker,
  introTitle,
  introDescription,
  pillars,
  processKicker,
  processTitle,
  processDescription,
  processSteps,
  openingsTitle,
  openingsAvailableTemplate,
  jobs,
  fallbackTitle,
  fallbackDescription,
  careersEmail,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
  ctaPrimary,
  ctaSecondary,
}: CareerPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
  const jobsRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useHeroEntrance(heroRef, motionReady);
  useCraftReveal(craftRef);

  /* Signature beat â€” openings list cascade */
  useGSAP(
    () => {
      if (gsapReducedMotion() || !jobsRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const targets = jobsRef.current?.querySelectorAll("[data-career-job-reveal]");
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
            trigger: jobsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }, jobsRef);

      return () => ctx.revert();
    },
    { scope: jobsRef, dependencies: [jobs] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="career-hero"
        aria-labelledby="career-hero-heading"
        data-testid="career-hero"
      >
        <EditorialHeroMedia
          prefix="career"
          image={CAREER_HERO_IMAGE}
          media={CAREER_HERO_MEDIA}
        />
        <div className="career-hero__scrim" aria-hidden="true" />

        <div className="career-hero__layout">
          <div className="career-hero__copy">
            <p
              data-career-hero-reveal
              className="home-kicker career-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="career-hero-heading" className="career-hero__title">
              <span data-career-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-career-hero-reveal className="career-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-career-hero-reveal className="career-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href={`mailto:${careersEmail}`}
                label="Email careers"
                surface="career-hero"
                variant="primary"
                context="hero"
              >
                Email careers
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/contact"
                label={ctaPrimary}
                surface="career-hero"
                variant="outline-light"
                context="hero"
              >
                {ctaPrimary}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={craftRef}
        className="about-craft-strip scheme-accent-wash"
        aria-label="Career perspective"
      >
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span data-career-craft-reveal className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote
              data-career-craft-reveal
              className="about-craft-quote__text home-heading text-balance"
            >
              {craftQuote}
            </blockquote>
            <figcaption data-career-craft-reveal className="about-craft-quote__attribution">
              {craftAttribution}
            </figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section data-testid="career-intro">
            <p className="home-kicker mb-6 md:mb-8">{introKicker}</p>
            <h2 className="home-heading mb-4 max-w-3xl">{introTitle}</h2>
            <p className="page-copy text-body mb-8 max-w-2xl">{introDescription}</p>
            <div className="career-pillars">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="career-pillar">
                  <h3 className="career-pillar__title home-why-card__title">{pillar.title}</h3>
                  <p className="career-pillar__detail">{pillar.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section className="career-process" data-testid="career-process">
            <div>
              <p className="home-kicker">{processKicker}</p>
              <h2 className="home-heading mt-3 mb-4">{processTitle}</h2>
              <p className="page-copy text-body max-w-md">{processDescription}</p>
            </div>
            <ol className="career-process__steps">
              {processSteps.map((step) => (
                <li key={step.title} className="career-process__step">
                  <h3 className="career-process__step-title home-why-card__title">
                    {step.title}
                  </h3>
                  <p className="career-process__step-detail">{step.detail}</p>
                </li>
              ))}
            </ol>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md">
        <HomeSectionInner>
          <section ref={jobsRef} data-testid="career-openings">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <h2 className="home-heading">{openingsTitle}</h2>
              <p className="home-kicker">
                {openingsAvailableTemplate.replace("{count}", String(jobs.length))}
              </p>
            </div>

            <div className="career-job-list">
              {jobs.map((job) => (
                <div key={`${job.title}-${job.department}`} data-career-job-reveal>
                  <JobCard
                    title={job.title}
                    department={job.department}
                    location={job.location}
                  />
                </div>
              ))}
            </div>

            <div className="career-fallback mt-8">
              <h3 className="home-why-card__title">{fallbackTitle}</h3>
              <p className="career-fallback__detail">{fallbackDescription}</p>
              <a href={`mailto:${careersEmail}`} className="link-arrow mt-4 inline-flex">
                {careersEmail}
              </a>
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
