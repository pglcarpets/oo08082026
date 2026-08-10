"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";

import {
  DEFAULT_HERO_FALLBACK,
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  HOMEPAGE_HERO_IMAGE_SIZES,
  resolveHeroTitleLines,
} from "@/features/site/data/homepage";
import { TrackedLink } from "@/components/ui/TrackedLink";
import { runAfterIdleOrInteraction } from "@/lib/client/afterIdle";
import { gsapReducedMotion } from "@/lib/helpers/gsapMotion";

const SLIDE_MS = 5000;
const POSTER = HOMEPAGE_HERO_IMAGES[0];

export function HomepageHero() {
  const t = useTranslations("home");
  const title = resolveHeroTitleLines(t.raw("hero.title"), HOMEPAGE_HERO_CONTENT.title);
  const kicker = t("hero.kicker");
  const secondaryCta = {
    label: t("hero.secondaryCta.label"),
    href: t("hero.secondaryCta.href"),
  };
  const glassProof = {
    badge: t("hero.glassProof.badge"),
    lead: t("hero.glassProof.lead"),
    support: t("hero.glassProof.support"),
    href: t("hero.glassProof.href"),
    cta: t("hero.glassProof.cta"),
  };

  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const [carouselEnabled, setCarouselEnabled] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [bgVisible, setBgVisible] = useState(true);

  const currentImage = HOMEPAGE_HERO_IMAGES[currentIndex] ?? POSTER;
  const resolvedImageSrc =
    failedImageSrc === currentImage.src &&
    String(currentImage.src) !== String(DEFAULT_HERO_FALLBACK)
      ? DEFAULT_HERO_FALLBACK
      : currentImage.src;

  const showSlideImage = carouselEnabled && currentIndex > 0;

  // Defer carousel + motion until idle or first interaction (protect LCP).
  useEffect(() => {
    return runAfterIdleOrInteraction(() => {
      setCarouselEnabled(true);
    }, { timeoutMs: 2800 });
  }, []);

  // Crossfade only when the active slide src changes after carousel is live.
  useEffect(() => {
    if (!carouselEnabled || currentIndex === 0) {
      setBgVisible(true);
      return;
    }
    if (gsapReducedMotion()) {
      setBgVisible(true);
      return;
    }
    let innerId = 0;
    const outerId = requestAnimationFrame(() => {
      setBgVisible(false);
      innerId = requestAnimationFrame(() => {
        setBgVisible(true);
      });
    });
    return () => {
      cancelAnimationFrame(outerId);
      cancelAnimationFrame(innerId);
    };
  }, [carouselEnabled, resolvedImageSrc, currentIndex]);

  // Auto-advance only after carousel is enabled.
  useEffect(() => {
    if (!carouselEnabled || HOMEPAGE_HERO_IMAGES.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HOMEPAGE_HERO_IMAGES.length);
    }, SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [carouselEnabled, currentIndex]);

  // Dynamic GSAP after LCP — parallax only. Do not animate copy from opacity 0
  // (text already painted for LCP/a11y; late from() would flash and shift layout).
  useEffect(() => {
    if (!carouselEnabled || gsapReducedMotion()) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !sectionRef.current || !bgRef.current) return;

      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        gsap.to(bgRef.current, {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, sectionRef);

      revert = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [carouselEnabled]);

  return (
    <section
      ref={sectionRef}
      id="home-hero"
      data-testid="homepage-hero"
      data-hero-underlap="true"
      className="home-hero relative w-full overflow-hidden bg-inverse pt-[max(5rem,env(safe-area-inset-top))] md:pt-24"
      aria-labelledby="home-hero-heading"
    >
      <div
        ref={bgRef}
        className="home-hero__media absolute inset-0 h-[115%] w-full -top-[7%] origin-center transition-opacity duration-500 ease-out"
        style={{ opacity: bgVisible || gsapReducedMotion() ? 1 : 0 }}
      >
        {/* Stable LCP poster — always mounted, never swapped off the tree. */}
        <Image
          src={
            failedImageSrc === POSTER.src &&
            String(POSTER.src) !== String(DEFAULT_HERO_FALLBACK)
              ? DEFAULT_HERO_FALLBACK
              : POSTER.src
          }
          alt={POSTER.alt}
          fill
          priority
          fetchPriority="high"
          sizes={HOMEPAGE_HERO_IMAGE_SIZES}
          quality={75}
          className={`home-hero__media-img object-cover object-center md:object-[64%_48%] ${
            showSlideImage ? "opacity-0" : "opacity-100"
          }`}
          onError={() => setFailedImageSrc(POSTER.src)}
        />

        {/* Secondary slides only after idle/interaction; never priority. */}
        {showSlideImage ? (
          <Image
            key={resolvedImageSrc}
            src={resolvedImageSrc}
            alt={currentImage.alt}
            fill
            loading="lazy"
            fetchPriority="low"
            sizes={HOMEPAGE_HERO_IMAGE_SIZES}
            quality={75}
            className="home-hero__media-img object-cover object-center md:object-[64%_48%]"
            onError={() => setFailedImageSrc(currentImage.src)}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/62 to-black/48 lg:bg-gradient-to-r lg:from-black/86 lg:via-black/58 lg:to-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />
      </div>

      <div className="home-hero__layout relative z-10 w-full py-10 pb-14 md:py-14 md:pb-16 lg:py-16 lg:pb-20">
        <div className="home-hero__copy w-full max-w-4xl space-y-5 md:space-y-6">
          <h1 id="home-hero-heading" className="home-hero-title-homepage text-inverse">
            {title.map((line, i) => (
              <span key={`${i}-${line}`} className="block overflow-hidden">
                <span
                  className={`inline-block${i === title.length - 1 ? " text-accent-italic-on-dark" : ""}`}
                >
                  {i < title.length - 1 ? `${line} ` : line}
                </span>
              </span>
            ))}
          </h1>

          <p className="home-kicker text-[color:var(--color-bronze-300)]">
            {kicker}
          </p>

          <div className="home-actions">
            <TrackedLink
              href={secondaryCta.href}
              label={secondaryCta.label}
              surface="homepage-hero"
              className="inline-flex min-h-11 btn-hero-secondary btn-accent shadow-theme-panel"
            >
              {secondaryCta.label}
            </TrackedLink>
          </div>
        </div>

        <div className="home-hero-glass-stack">
          <TrackedLink
            href={glassProof.href}
            label={glassProof.cta}
            surface="homepage-hero-proof"
            aria-label={glassProof.cta}
            className="home-hero-proof-panel group text-inverse"
          >
            <span className="home-hero-proof-panel__badge">
              <SealCheck className="shrink-0" size={16} weight="fill" aria-hidden="true" />
              {glassProof.badge}
            </span>
            <p className="home-hero-proof-panel__lead">{glassProof.lead}</p>
            <p className="home-hero-proof-panel__support text-inverse-body">{glassProof.support}</p>
            <span className="home-hero-proof-panel__cta">
              {glassProof.cta}
              <ArrowRight className="shrink-0" size={16} weight="bold" aria-hidden="true" />
            </span>
          </TrackedLink>
        </div>
      </div>

      <div
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-0.5 sm:bottom-6"
        role="group"
        aria-label="Hero project images"
      >
        {HOMEPAGE_HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setCarouselEnabled(true);
              setCurrentIndex(i);
            }}
            aria-label={`Show project image ${i + 1} of ${HOMEPAGE_HERO_IMAGES.length}`}
            aria-current={i === currentIndex ? "true" : undefined}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          >
            <span
              aria-hidden="true"
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex ? "home-hero-progress--active" : "home-hero-progress"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
