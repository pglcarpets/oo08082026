"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, CheckCircle, Clock, ShieldCheck } from "@phosphor-icons/react";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { CategoryTileImage } from "@/components/products/CategoryTileImage";
import { MarketingImage } from "@/components/site/MarketingImage";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { CATEGORY_ROUTE_COPY } from "@/features/site/data/routeCopy";
import {
  PRODUCTS_HERO_IMAGE,
  PRODUCTS_HERO_MEDIA,
  PRODUCTS_STRATEGY_PREVIEW_IMAGE,
  type ProductsCategoryTile,
} from "@/features/site/data/productsPage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

registerGsapPlugins();

const PILLAR_ICONS = {
  "check-circle": CheckCircle,
  clock: Clock,
  shield: ShieldCheck,
} as const;

type ProductPillar = {
  title: string;
  detail: string;
  icon?: keyof typeof PILLAR_ICONS;
};

export type { ProductPillar };

export interface ProductsPageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  heroPrimaryCta: string;
  heroSecondaryCta: string;
  craftQuote: string;
  craftAttribution: string;
  introKicker: string;
  introTitleLead: string;
  introTitleAccent: string;
  introDescription: string;
  featureBullets: string[];
  categoryRoutesKicker: string;
  categoryRoutesDescription: string;
  categoryRoutesCta: string;
  rangeKicker: string;
  rangeTitleLead: string;
  rangeTitleAccent: string;
  pillarsKicker: string;
  pillarsTitleLead: string;
  pillarsTitleAccent: string;
  pillarsIntro: string;
  pillars: ProductPillar[];
  categories: ProductsCategoryTile[];
  deskKicker: string;
  deskTitle: string;
  deskDescription: string;
  deskPrimaryCta: string;
  deskSecondaryCta: string;
  deskTertiaryCta: string;
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

export function ProductsPageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  heroPrimaryCta,
  heroSecondaryCta,
  craftQuote,
  craftAttribution,
  introKicker,
  introTitleLead,
  introTitleAccent,
  introDescription,
  featureBullets,
  categoryRoutesKicker,
  categoryRoutesDescription,
  categoryRoutesCta,
  rangeKicker,
  rangeTitleLead,
  rangeTitleAccent,
  pillarsKicker,
  pillarsTitleLead,
  pillarsTitleAccent,
  pillarsIntro,
  pillars,
  categories,
  deskKicker,
  deskTitle,
  deskDescription,
  deskPrimaryCta,
  deskSecondaryCta,
  deskTertiaryCta,
}: ProductsPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const strategyRef = useRef<HTMLElement>(null);
  const pillarsRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-products-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".products-hero__media");
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

  useScrollReveal(strategyRef, "[data-products-strategy-reveal]");
  useScrollReveal(pillarsRef, "[data-products-pillar-reveal]", [pillars]);
  useScrollReveal(categoriesRef, "[data-products-category-reveal]", [categories]);

  return (
    <>
      <section
        ref={heroRef}
        className="products-hero"
        aria-labelledby="products-hero-heading"
        data-testid="products-hero"
      >
        <EditorialHeroMedia
          prefix="products"
          image={PRODUCTS_HERO_IMAGE}
          media={PRODUCTS_HERO_MEDIA}
        />
        <div className="products-hero__scrim" aria-hidden="true" />

        <div className="products-hero__layout">
          <div className="products-hero__copy">
            <p
              data-products-hero-reveal
              className="home-kicker products-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="products-hero-heading" className="products-hero__title">
              <span data-products-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-products-hero-reveal className="products-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-products-hero-reveal className="products-hero__actions flex flex-wrap gap-3">
              <MarketingCtaLink
                href="#products-categories"
                label={heroPrimaryCta}
                surface="products-hero"
                variant="primary"
                context="hero"
              >
                {heroPrimaryCta}
              </MarketingCtaLink>
              <MarketingCtaLink
                href="/contact"
                label={heroSecondaryCta}
                surface="products-hero"
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
          <section
            ref={strategyRef}
            className="products-strategy"
            data-testid="products-intro"
          >
            <div
              data-products-strategy-reveal
              className="products-strategy__panel scheme-panel scheme-border border px-6 py-7 md:px-8 md:py-8"
            >
              <p className="home-kicker">{introKicker}</p>
              <h2 className="home-heading mt-3 max-w-3xl">
                {introTitleLead}{" "}
                <span className="text-accent-italic">{introTitleAccent}</span>
              </h2>
              <p className="page-copy text-body mt-4 max-w-2xl">{introDescription}</p>

              <figure className="products-strategy__quote">
                <blockquote className="products-strategy__quote-text">{craftQuote}</blockquote>
                <figcaption className="products-strategy__quote-source">{craftAttribution}</figcaption>
              </figure>

              <ul className="products-strategy__bullets">
                {featureBullets.map((item) => (
                  <li key={item} className="products-strategy__bullet">
                    <span className="products-strategy__bullet-mark" aria-hidden="true">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="products-strategy__side">
              <div
                data-products-strategy-reveal
                className="products-strategy__preview scheme-panel scheme-border border p-4 md:p-5"
              >
                <div className="products-strategy__preview-frame relative">
                  <MarketingImage
                    src={PRODUCTS_STRATEGY_PREVIEW_IMAGE.src}
                    alt={PRODUCTS_STRATEGY_PREVIEW_IMAGE.alt}
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="products-strategy__preview-img"
                  />
                  <div className="absolute inset-0 surface-overlay-inverse-12" aria-hidden="true" />
                </div>
              </div>

              <div
                data-products-strategy-reveal
                className="products-strategy__routes scheme-panel scheme-border border px-5 py-5 md:px-6"
              >
                <div className="products-strategy__routes-head">
                  <div>
                    <p className="home-kicker">{categoryRoutesKicker}</p>
                    <p className="page-copy-sm text-body mt-2">{categoryRoutesDescription}</p>
                  </div>
                  <Link href="#products-categories" className="link-arrow shrink-0">
                    {categoryRoutesCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="products-strategy__chips">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={category.href}
                      className="btn-outline btn-pill-compact"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="lg" className="border-t-0">
        <HomeSectionInner>
          <section
            ref={categoriesRef}
            id="products-categories"
            data-testid="products-categories"
          >
            <div data-products-category-reveal className="products-range-header">
              <p className="products-range-header__kicker home-kicker">{rangeKicker}</p>
              <h2 className="home-heading">
                {rangeTitleLead}{" "}
                <span className="text-accent-italic">{rangeTitleAccent}</span>
              </h2>
            </div>

            {categories.length === 0 ? (
              <div
                className="scheme-panel scheme-border rounded-2xl border px-6 py-10 text-center"
                role="status"
                data-products-category-reveal
              >
                <h3 className="home-heading text-balance">
                  {CATEGORY_ROUTE_COPY.offlineTitle}
                </h3>
                <p className="page-copy text-body mt-4 mx-auto max-w-lg">
                  {CATEGORY_ROUTE_COPY.offlineDescription}
                </p>
              </div>
            ) : (
              <div className="products-category-grid">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={category.href}
                    data-products-category-reveal
                    className="products-category-tile group"
                  >
                    <div className="products-category-tile__media">
                      <CategoryTileImage src={category.image} alt="" />
                      <div className="products-category-tile__media-scrim" />
                    </div>
                    <div className="products-category-tile__body">
                      <div>
                        <h3 className="products-category-tile__title">{category.name}</h3>
                        <p className="products-category-tile__meta">
                          {category.productCount} products
                        </p>
                      </div>
                      <span className="products-category-tile__arrow" aria-hidden="true">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section ref={pillarsRef} className="products-pillars" data-testid="products-pillars">
            <div className="products-pillars-header">
              <div>
                <p data-products-pillar-reveal className="home-kicker">{pillarsKicker}</p>
                <h2 data-products-pillar-reveal className="home-heading mt-3">
                  {pillarsTitleLead}{" "}
                  <span className="text-accent-italic">{pillarsTitleAccent}</span>
                </h2>
              </div>
              <p data-products-pillar-reveal className="products-pillars-header__intro">
                {pillarsIntro}
              </p>
            </div>
            <ol className="products-pillar-grid">
              {pillars.map((pillar) => {
                const Icon = pillar.icon ? PILLAR_ICONS[pillar.icon] : CheckCircle;
                const headingId = `products-pillar-${pillar.title.replace(/\s+/g, "-").toLowerCase()}`;
                return (
                  <li
                    key={pillar.title}
                    data-products-pillar-reveal
                    className="products-pillar-card"
                    aria-labelledby={headingId}
                  >
                    <span className="products-pillar-card__icon">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 id={headingId} className="products-pillar-card__title">{pillar.title}</h3>
                    <p className="products-pillar-card__detail">{pillar.detail}</p>
                  </li>
                );
              })}
            </ol>
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
              { href: "/solutions", label: deskSecondaryCta, variant: "outline-light" },
              { href: "/downloads", label: deskTertiaryCta, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
