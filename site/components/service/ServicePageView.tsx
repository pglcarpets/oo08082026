"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { SERVICE_HERO_IMAGE, SERVICE_HERO_MEDIA } from "@/features/site/data/servicePage";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

type ServicePillar = { title: string; detail: string };

type ServiceChannel =
  | { label: string; kind: "supportPhone" }
  | { label: string; kind: "salesEmail" }
  | { label: string; kind: "whatsapp"; value: string; href: string };

export interface ServicePageViewProps {
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  craftQuote: string;
  craftAttribution: string;
  frameworkKicker: string;
  frameworkTitle: string;
  pillars: readonly ServicePillar[];
  channelsKicker: string;
  channelsTitle: string;
  channels: readonly ServiceChannel[];
  supportKicker: string;
  supportDescription: string;
  primaryCta: string;
  secondaryCta: string;
  tertiaryCta: string;
  ctaKicker: string;
  ctaTitleLead: string;
  ctaTitleAccent: string;
  ctaDescription: string;
}

/** Signature beat â€” bronze rule draw, then craft pull-quote scroll reveal. */
function useCraftReveal(sectionRef: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      if (gsapReducedMotion() || !sectionRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const rule = sectionRef.current?.querySelector(".about-craft-quote__rule");
        const targets = sectionRef.current?.querySelectorAll(
          "[data-service-craft-reveal]:not(.about-craft-quote__rule)",
        );

        if (rule) {
          gsap.from(rule, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 88%",
              once: true,
            },
          });
        }

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

export function ServicePageView({
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  craftQuote,
  craftAttribution,
  frameworkKicker,
  frameworkTitle,
  pillars,
  channelsKicker,
  channelsTitle,
  channels,
  supportKicker,
  supportDescription,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  ctaKicker,
  ctaTitleLead,
  ctaTitleAccent,
  ctaDescription,
}: ServicePageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const craftRef = useRef<HTMLElement>(null);
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

      const revealTargets = heroRef.current.querySelectorAll("[data-service-hero-reveal]");
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

        const media = heroRef.current?.querySelector(".service-hero__media");
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

  useCraftReveal(craftRef);

  return (
    <>
      <section
        ref={heroRef}
        className="service-hero"
        aria-labelledby="service-hero-heading"
        data-testid="service-hero"
      >
        <EditorialHeroMedia
          prefix="service"
          image={SERVICE_HERO_IMAGE}
          media={SERVICE_HERO_MEDIA}
        />
        <div className="service-hero__scrim" aria-hidden="true" />

        <div className="service-hero__layout">
          <div className="service-hero__copy">
            <p
              data-service-hero-reveal
              className="home-kicker service-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1 id="service-hero-heading" className="service-hero__title">
              <span data-service-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-service-hero-reveal className="service-hero__subtitle">
              {heroSubtitle}
            </p>
            <div data-service-hero-reveal className="service-hero__actions">
              <MarketingCtaLink
                href="/contact"
                label={primaryCta}
                surface="service-hero"
                variant="primary"
                context="hero"
              >
                {primaryCta}
              </MarketingCtaLink>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={craftRef}
        className="about-craft-strip scheme-accent-wash"
        aria-label="Service perspective"
      >
        <div className="home-shell-xl">
          <figure className="about-craft-quote">
            <span data-service-craft-reveal className="about-craft-quote__rule" aria-hidden="true" />
            <blockquote
              data-service-craft-reveal
              className="about-craft-quote__text home-heading text-balance"
            >
              {craftQuote}
            </blockquote>
            <figcaption data-service-craft-reveal className="about-craft-quote__attribution">
              {craftAttribution}
            </figcaption>
          </figure>
        </div>
      </section>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section data-testid="service-pillars">
            <p className="home-kicker mb-6 md:mb-8">{frameworkKicker}</p>
            <h2 className="home-heading mb-8 max-w-3xl">{frameworkTitle}</h2>
            <div className="service-pillars">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="service-pillar">
                  <h3 className="service-pillar__title home-why-card__title">{pillar.title}</h3>
                  <p className="service-pillar__detail">{pillar.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md" borderY>
        <HomeSectionInner>
          <section className="service-channels-layout" data-testid="service-channels">
            <div>
              <p className="home-kicker">{channelsKicker}</p>
              <h2 className="home-heading mt-3 mb-6">{channelsTitle}</h2>
              <div className="service-channels">
                {channels.map((channel) => {
                  if (channel.kind === "supportPhone") {
                    const phone = SITE_CONTACT.supportPhone;
                    return (
                      <a
                        key={channel.label}
                        href={`tel:${phone.replace(/\s+/g, "")}`}
                        className="service-channel-row"
                      >
                        <p className="service-channel-row__label">{channel.label}</p>
                        <p className="service-channel-row__value">{phone}</p>
                      </a>
                    );
                  }

                  if (channel.kind === "salesEmail") {
                    const email = SITE_CONTACT.salesEmail;
                    return (
                      <a
                        key={channel.label}
                        href={`mailto:${email}`}
                        className="service-channel-row"
                      >
                        <p className="service-channel-row__label">{channel.label}</p>
                        <p className="service-channel-row__value">{email}</p>
                      </a>
                    );
                  }

                  return (
                    <a
                      key={channel.label}
                      href={channel.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="service-channel-row"
                    >
                      <p className="service-channel-row__label">{channel.label}</p>
                      <p className="service-channel-row__value">{channel.value}</p>
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="service-support-panel">
              <p className="home-kicker">{supportKicker}</p>
              <p className="service-support-note">{supportDescription}</p>
              <div className="service-support-panel__actions">
                <MarketingCtaLink
                  href="/contact"
                  label={primaryCta}
                  surface="service-support-panel"
                  variant="primary"
                >
                  {primaryCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/contact"
                  label={secondaryCta}
                  surface="service-support-panel"
                  variant="outline"
                >
                  {secondaryCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/downloads"
                  label={tertiaryCta}
                  surface="service-support-panel"
                  variant="outline"
                >
                  {tertiaryCta}
                </MarketingCtaLink>
              </div>
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
              { href: "/contact", label: primaryCta, variant: "primary" },
              { href: "/downloads", label: tertiaryCta, variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
