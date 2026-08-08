"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, SealCheck } from "@phosphor-icons/react";

import {
  DEFAULT_HERO_FALLBACK,
  HOMEPAGE_HERO_CONTENT,
  HOMEPAGE_HERO_IMAGES,
  resolveHeroTitleLines,
} from "@/features/site/data/homepage";
import { TrackedLink } from "@/components/ui/TrackedLink";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

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
    source: HOMEPAGE_HERO_CONTENT.glassProof.source,
    owner: HOMEPAGE_HERO_CONTENT.glassProof.owner,
    reviewDate: HOMEPAGE_HERO_CONTENT.glassProof.reviewDate,
  };

  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const hasMountedImageRef = useRef(false);

  const [motionReady, setMotionReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageSrc, setFailedImageSrc] = useState<string | null>(null);
  const [bgVisible, setBgVisible] = useState(true);

  const currentImage = HOMEPAGE_HERO_IMAGES[currentIndex] ?? HOMEPAGE_HERO_IMAGES[0];
  const resolvedImageSrc =
    failedImageSrc === currentImage.src && String(currentImage.src) !== String(DEFAULT_HERO_FALLBACK)
      ? DEFAULT_HERO_FALLBACK
      : currentImage.src;

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (gsapReducedMotion()) {
      const frameId = requestAnimationFrame(() => {
        setBgVisible(true);
      });
      return () => {
        cancelAnimationFrame(frameId);
      };
    }
    if (!hasMountedImageRef.current) {
      hasMountedImageRef.current = true;
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
  }, [resolvedImageSrc]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HOMEPAGE_HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  useGSAP(
    () => {
      if (!motionReady || !bgRef.current || gsapReducedMotion()) return;
      gsap.fromTo(
        bgRef.current,
        { opacity: 0.75, scale: 1.045 },
        { opacity: 1, scale: 1, duration: 2.2, ease: "power2.out" }
      );
    },
    { scope: sectionRef, dependencies: [currentIndex, motionReady] }
  );

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion()) {
        return;
      }

      const revealTargets = copyRef.current?.querySelectorAll("[data-hero-reveal]");
      if (!revealTargets?.length) {
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

        if (glassRef.current) {
          gsap.from(glassRef.current, {
            y: 20,
            opacity: 0,
            duration: 0.9,
            delay: 0.35,
            ease: GSAP_EASE_OUT,
          });
        }

        if (bgRef.current && sectionRef.current) {
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
        }
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [motionReady] },
  );

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
        <Image
          src={resolvedImageSrc}
          alt={currentImage.alt}
          fill
          priority={currentIndex === 0}
          fetchPriority={currentIndex === 0 ? "high" : "auto"}
          loading={currentIndex === 0 ? "eager" : undefined}
          sizes="(max-width: 640px) 640px, (max-width: 1080px) 1080px, (max-width: 1920px) 1920px, 1920px"
          className="home-hero__media-img object-cover object-center md:object-[64%_48%]"
          onError={() => setFailedImageSrc(currentImage.src)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/62 to-black/48 lg:bg-gradient-to-r lg:from-black/86 lg:via-black/58 lg:to-black/18" />
        <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/78 via-black/28 to-transparent" />
      </div>

      <div className="home-hero__layout relative z-10 w-full py-10 pb-14 md:py-14 md:pb-16 lg:py-16 lg:pb-20">
        <div ref={copyRef} className="home-hero__copy w-full max-w-4xl space-y-5 md:space-y-6">
          <h1 id="home-hero-heading" className="home-hero-title-homepage text-inverse">
            {title.map((line, i) => (
              <span key={`${i}-${line}`} className="block overflow-hidden">
                <span
                  data-hero-reveal
                  className={`inline-block${i === title.length - 1 ? " text-accent-italic-on-dark" : ""}`}
                >
                  {i < title.length - 1 ? `${line} ` : line}
                </span>
              </span>
            ))}
          </h1>

          <p data-hero-reveal className="home-kicker text-[color:var(--color-bronze-300)]">
            {kicker}
          </p>

          <div data-hero-reveal className="home-actions">
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

        <div ref={glassRef} className="home-hero-glass-stack">
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
