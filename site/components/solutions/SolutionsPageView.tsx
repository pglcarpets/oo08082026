"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "@phosphor-icons/react";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import {
  SOLUTIONS_HERO_IMAGE,
  SOLUTIONS_HERO_MEDIA,
} from "@/features/site/data/solutionsPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type SolutionCategory = {
  title: string;
  href: string;
  image: string;
};

type DeliveryMedia = {
  src: string;
  alt: string;
};

export interface SolutionsPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  deliveryKicker: string;
  deliveryTitle: string;
  deliveryDescription: string;
  deliveryMedia: DeliveryMedia;
  categoriesTitleLead: string;
  categoriesTitleAccent: string;
  categories: readonly SolutionCategory[];
  planningKicker: string;
  planningTitle: string;
  planningDescription: string;
  planningPrimaryCta: string;
  planningSecondaryCta: string;
  planningTertiaryCta: string;
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

export function SolutionsPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroPrimaryCta,
  heroSecondaryCta,
  deliveryKicker,
  deliveryTitle,
  deliveryDescription,
  deliveryMedia,
  categoriesTitleLead,
  categoriesTitleAccent,
  categories,
  planningKicker,
  planningTitle,
  planningDescription,
  planningPrimaryCta,
  planningSecondaryCta,
  planningTertiaryCta,
}: SolutionsPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const deliveryRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-solutions-hero-reveal]");
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

  useScrollReveal(deliveryRef, "[data-solutions-delivery-reveal]");
  useScrollReveal(categoriesRef, "[data-solutions-category-reveal]", [categories]);

  return (
    <>
      <section
        ref={heroRef}
        className="solutions-hero"
        aria-labelledby="solutions-hero-heading"
        data-testid="solutions-hero"
      >
        <EditorialHeroMedia
          prefix="solutions"
          image={SOLUTIONS_HERO_IMAGE}
          media={SOLUTIONS_HERO_MEDIA}
        />
        <div className="solutions-hero__scrim" aria-hidden="true" />

        <div className="solutions-hero__layout">
          <div className="solutions-hero__copy">
            <p
              data-solutions-hero-reveal
              className="home-kicker solutions-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="solutions-hero-heading" className="solutions-hero__title">
              <span data-solutions-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-solutions-hero-reveal className="solutions-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-solutions-hero-reveal className="solutions-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href="/contact"
                label={heroPrimaryCta}
                surface="solutions-hero"
                variant="primary"
                context="hero"
              >
                {heroPrimaryCta}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/products"
                label={heroSecondaryCta}
                surface="solutions-hero"
                variant="outline-light"
                context="hero"
              >
                {heroSecondaryCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={deliveryRef} className="solutions-delivery" data-testid="solutions-delivery">
            <div className="solutions-delivery__media" data-solutions-delivery-reveal>
              <Image
                src={deliveryMedia.src}
                alt={deliveryMedia.alt}
                fill
                sizes="(min-width: 56rem) 52vw, 100vw"
                className="solutions-delivery__img"
              />
            </div>
            <div className="solutions-delivery__copy">
              <p data-solutions-delivery-reveal className="home-kicker">
                {deliveryKicker}
              </p>
              <h2 data-solutions-delivery-reveal className="home-heading">
                {deliveryTitle}
              </h2>
              <p data-solutions-delivery-reveal className="solutions-delivery__lead">
                {deliveryDescription}
              </p>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section ref={categoriesRef} data-testid="solutions-categories">
            <h2 data-solutions-category-reveal className="home-heading mb-6 max-w-3xl md:mb-8">
              {categoriesTitleLead}{" "}
              <span className="text-accent-italic">{categoriesTitleAccent}</span>
            </h2>

            <div className="solutions-category-grid">
              {categories.map((solution, index) => (
                <Link
                  key={solution.href}
                  href={solution.href}
                  data-solutions-category-reveal
                  className={`solutions-category-card group ${
                    index === 0 ? "solutions-category-card--feature" : ""
                  }`}
                >
                  <Image
                    src={solution.image}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes={
                      index === 0
                        ? "(max-width: 767px) 100vw, 60vw"
                        : "(max-width: 519px) 100vw, (max-width: 1024px) 45vw, 30vw"
                    }
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="home-collection-card__overlay" />
                  <div className="home-collection-card__footer absolute inset-x-0 bottom-0 flex items-center justify-between gap-4">
                    <h3 className="typ-overlay-title text-inverse">{solution.title}</h3>
                    <span className="home-collection-card__arrow shrink-0" aria-hidden="true">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={planningKicker}
            title={planningTitle}
            description={planningDescription}
            actions={[
              { href: "/contact", label: planningPrimaryCta, variant: "primary" },
              { href: "/products", label: planningSecondaryCta, variant: "outline-light" },
              { href: "/downloads", label: planningTertiaryCta, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
