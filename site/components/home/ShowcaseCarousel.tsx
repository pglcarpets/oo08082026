"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from "@phosphor-icons/react";

import { PartnershipPanel } from "@/components/home/PartnershipBanner";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

export interface CarouselItem {
  id: string;
  name: string;
  label: string;
  image: string;
  link: string;
  description?: string;
}

interface ShowcaseCarouselProps {
  sectionLabel: string;
  sectionAriaLabel: string;
  sectionTitle: ReactNode;
  items: CarouselItem[];
  browseLink?: string;
  browseLabel?: string;
  className?: string;
  dark?: boolean;
  showPartnership?: boolean;
}

export function ShowcaseCarousel({
  sectionLabel,
  sectionAriaLabel,
  sectionTitle,
  items,
  browseLink,
  browseLabel = "Browse all",
  className = "",
  dark = false,
  showPartnership = false,
}: ShowcaseCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [controlsReady, setControlsReady] = useState(false);

  const navButtonClass = `home-showcase-nav-button ${
    dark ? "home-showcase-nav-button--dark" : "home-showcase-nav-button--light"
  }`;
  const browseLinkClass = `home-showcase-browse-link ${
    dark ? "home-showcase-browse-link--dark" : "home-showcase-browse-link--light"
  }`;
  const sectionClass = `home-showcase-section section-y-sm ${
    dark ? "home-showcase-section--dark" : "home-showcase-section--light"
  }`;

  const onSelect = useCallback(() => {
    if (!emblaApi) {return;}
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) {return;}
    function init() {
      setControlsReady(true);
    }
    init();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    const frameId = window.requestAnimationFrame(onSelect);
    return () => {
      window.cancelAnimationFrame(frameId);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const headerEls = headerRef.current?.querySelectorAll("[data-showcase-reveal]");
        if (headerEls?.length) {
          gsap.from(headerEls, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: headerRef.current,
              start: "top 82%",
              once: true,
            },
          });
        }

        const cards = trackRef.current?.querySelectorAll("[data-showcase-card]");
        if (cards?.length) {
          gsap.from(cards, {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: trackRef.current,
              start: "top 85%",
              once: true,
            },
          });
        }
      }, sectionRef);

      return () => ctx.revert();
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  return (
    <section
      ref={sectionRef}
      data-testid="home-showcase"
      className={`${sectionClass} ${className}`.trim()}
      aria-label={sectionAriaLabel}
    >
      <div className="home-shell-xl">
        {showPartnership ? (
          <div className="mb-10">
            <PartnershipPanel />
          </div>
        ) : null}

        <div
          ref={headerRef}
          className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            {sectionLabel ? (
              <p
                data-showcase-reveal
                className={`typ-label mb-3 ${
                  dark ? "text-inverse-muted" : "text-body"
                }`}
              >
                {sectionLabel}
              </p>
            ) : null}
            <h2
              data-showcase-reveal
              className={`home-heading ${
                dark ? "text-inverse" : "text-heading"
              }`}
            >
              {sectionTitle}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              aria-label="Previous project"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={controlsReady && !canScrollPrev}
              className={navButtonClass}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next project"
              onClick={() => emblaApi?.scrollNext()}
              disabled={controlsReady && !canScrollNext}
              className={navButtonClass}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {browseLink ? (
              <Link href={browseLink} className={`${browseLinkClass} typ-cta`}>
                {browseLabel}
              </Link>
            ) : null}
          </div>
        </div>

        <div ref={trackRef}>
          <div
            ref={emblaRef}
            className="overflow-hidden"
            role="region"
            aria-roledescription="carousel"
            aria-label={`${sectionAriaLabel} slides`}
          >
          <div className="flex gap-5">
            {items.map((item) => (
              <article
                key={item.id}
                data-showcase-card
                className="group relative min-w-0 shrink-0 grow-0 basis-[min(88vw,22rem)] sm:basis-[min(72vw,24rem)] lg:basis-[min(42vw,28rem)]"
              >
                <Link
                  href={item.link}
                  className="block overflow-hidden rounded-[var(--radius-giant)]"
                  title={item.name}
                >
                  <div className="home-showcase-card__media-box relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      aria-hidden="true"
                      fill
                      quality={85}
                      sizes="(max-width: 768px) 88vw, (max-width: 1280px) 42vw, 28rem"
                      className="home-showcase-card__media object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="home-showcase-overlay" aria-hidden="true" />
                    <div className="home-showcase-card__caption">
                      <h3 className="typ-overlay-title text-inverse">{item.name}</h3>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          {items.length > 5 ? (
            <p
              className={`home-showcase-mobile-count ${
                dark ? "text-inverse-muted" : "text-muted"
              }`}
            >
              {selectedIndex + 1} / {items.length}
            </p>
          ) : (
            <div className="flex gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={selectedIndex === index ? "true" : undefined}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`home-showcase-dot ${
                    selectedIndex === index
                      ? dark
                        ? "home-showcase-dot--active-dark"
                        : "home-showcase-dot--active-light"
                      : dark
                        ? "home-showcase-dot--inactive-dark"
                        : "home-showcase-dot--inactive-light"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
