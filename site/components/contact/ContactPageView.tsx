"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MapPin, Phone, Envelope as Mail } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import { CustomerQueryForm } from "@/components/contact/CustomerQueryForm";
import { HomeSection, HomeSectionInner } from "@/components/home/layout";
import { EditorialHeroMedia } from "@/components/site/EditorialHeroMedia";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { CONTACT_HERO_IMAGE, CONTACT_HERO_MEDIA } from "@/features/site/data/contactPage";
import { SITE_CONTACT } from "@/features/site/data/contact";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";

registerGsapPlugins();

/** Skip entrance motion under md — mobile needs instant, solid UI (no opacity/y stuck states). */
function contactMotionDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (gsapReducedMotion()) return true;
  return window.matchMedia("(max-width: 47.99rem)").matches;
}

type ContactOffice = { title: string; lines: string[] };

export interface ContactPageViewProps {
  intent: string | null;
  source: string | null;
  heroKicker: string;
  heroTitleLead: string;
  heroTitleAccent: string;
  heroSubtitle: string;
  sectionTitle: string;
  introTitle: string;
  resourceDeskLead: string;
  resourceDeskCta: string;
  resourceDeskTail: string;
  quickDeskKicker: string;
  quickDeskTitle: string;
  quickDeskDescription: string;
  quickDeskPrimaryCta: string;
  quickDeskSecondaryCta: string;
  channelRegionLabel: string;
  channelQuotesLabel: string;
  channelSupportLabel: string;
  channelEmailLabel: string;
  channelsAriaLabel: string;
  offices: ContactOffice[];
}

/**
 * Signature beat: bronze rule scale-X draw, then form-band entrance (desktop only).
 * Mobile: no GSAP — form and copy paint fully visible immediately.
 */
export function ContactPageView({
  intent,
  source,
  heroKicker,
  heroTitleLead,
  heroTitleAccent,
  heroSubtitle,
  sectionTitle,
  introTitle,
  resourceDeskLead,
  resourceDeskCta,
  resourceDeskTail,
  quickDeskKicker,
  quickDeskTitle,
  quickDeskDescription,
  quickDeskPrimaryCta,
  quickDeskSecondaryCta,
  channelRegionLabel,
  channelQuotesLabel,
  channelSupportLabel,
  channelEmailLabel,
  channelsAriaLabel,
  offices,
}: ContactPageViewProps) {
  const heroRef = useRef<HTMLElement>(null);
  const bronzeRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || contactMotionDisabled() || !heroRef.current) {
        return;
      }

      const revealTargets = heroRef.current.querySelectorAll("[data-contact-hero-reveal]");
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
          clearProps: "opacity,transform",
        });
      }, heroRef);

      return () => ctx.revert();
    },
    { scope: heroRef, dependencies: [motionReady] },
  );

  useGSAP(
    () => {
      if (!motionReady || contactMotionDisabled()) {
        return;
      }

      const rule = bronzeRef.current?.querySelector(".about-craft-quote__rule");
      const formBand = mainRef.current?.querySelector("[data-contact-form-reveal]");
      if (!rule && !formBand) {
        return;
      }

      const ctx = gsap.context(() => {
        if (rule) {
          gsap.from(rule, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 0.7,
            ease: GSAP_EASE_OUT,
            clearProps: "transform",
            scrollTrigger: {
              trigger: bronzeRef.current,
              start: "top 90%",
              once: true,
            },
          });
        }

        if (formBand) {
          gsap.set(formBand, { opacity: 1, clearProps: "opacity" });
          gsap.from(formBand, {
            y: GSAP_SCROLL_REVEAL.y,
            duration: GSAP_SCROLL_REVEAL.duration,
            ease: GSAP_EASE_OUT,
            clearProps: "transform",
            scrollTrigger: {
              trigger: formBand,
              start: "top 88%",
              once: true,
            },
          });
        }
      }, mainRef);

      return () => ctx.revert();
    },
    { scope: mainRef, dependencies: [motionReady] },
  );

  return (
    <>
      <section
        ref={heroRef}
        className="contact-hero"
        aria-labelledby="contact-hero-heading"
        data-testid="contact-hero"
      >
        <EditorialHeroMedia
          prefix="contact"
          image={CONTACT_HERO_IMAGE}
          media={CONTACT_HERO_MEDIA}
        />
        <div className="contact-hero__scrim" aria-hidden="true" />

        <div className="contact-hero__layout">
          <div className="contact-hero__copy">
            <p
              data-contact-hero-reveal
              className="home-kicker contact-hero__kicker text-[color:var(--color-bronze-300)]"
            >
              {heroKicker}
            </p>
            <h1
              id="contact-hero-heading"
              className="home-hero-title-route contact-hero__title text-inverse text-start"
            >
              <span data-contact-hero-reveal className="block">
                {heroTitleLead}{" "}
                <span className="text-accent-italic-on-dark">{heroTitleAccent}</span>
              </span>
            </h1>
            <p data-contact-hero-reveal className="contact-hero__subtitle">
              {heroSubtitle}
            </p>
          </div>
        </div>

        <div ref={bronzeRef} className="contact-hero__bronze" aria-hidden="true">
          <div className="contact-hero__bronze-inner">
            <span className="about-craft-quote__rule" />
          </div>
        </div>
      </section>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <section ref={mainRef} className="contact-main" data-testid="contact-main">
            <div className="contact-summary">
              <div className="contact-summary__intro">
                <p className="home-kicker">{sectionTitle}</p>
                <h2 className="home-heading mt-2">{introTitle}</h2>
                <p className="page-copy-sm text-body mt-3 max-w-prose">
                  {resourceDeskLead}{" "}
                  <Link
                    href="/downloads"
                    className="font-semibold text-primary transition-colors hover:text-primary-hover min-h-11 inline-flex items-center"
                  >
                    {resourceDeskCta}
                  </Link>{" "}
                  {resourceDeskTail}
                </p>
              </div>

              <div className="contact-offices">
                {offices.map((office) => (
                  <article key={office.title} className="contact-office-card">
                    <h3 className="contact-office-card__title">{office.title}</h3>
                    <address className="page-copy-sm text-body not-italic">
                      {office.lines.map((line) => (
                        <p key={`${office.title}-${line}`} className="m-0">
                          {line}
                        </p>
                      ))}
                    </address>
                  </article>
                ))}
              </div>

              <div
                className="contact-channels-panel"
                role="region"
                aria-label={channelsAriaLabel}
              >
                <div className="contact-channel">
                  <MapPin className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelRegionLabel}</p>
                    <p className="page-copy text-body">{SITE_CONTACT.regionLine}</p>
                  </div>
                </div>
                <div className="contact-channel">
                  <Phone className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelQuotesLabel}</p>
                    <a
                      href={`tel:${SITE_CONTACT.salesPhone.replace(/\s+/g, "")}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.salesPhone}
                    </a>
                  </div>
                </div>
                <div className="contact-channel">
                  <Phone className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelSupportLabel}</p>
                    <a
                      href={`tel:${SITE_CONTACT.supportPhone.replace(/\s+/g, "")}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.supportPhone}
                    </a>
                  </div>
                </div>
                <div className="contact-channel">
                  <Mail className="contact-channel__icon" aria-hidden />
                  <div>
                    <p className="contact-channel__label">{channelEmailLabel}</p>
                    <a
                      href={`mailto:${SITE_CONTACT.salesEmail}`}
                      className="contact-channel__link min-h-11 inline-flex items-center"
                    >
                      {SITE_CONTACT.salesEmail}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="contact-form-band"
              data-testid="contact-form-band"
              data-contact-form-reveal
            >
              <div className="contact-quick-desk" data-testid="contact-quick-desk">
                <p className="home-kicker">{quickDeskKicker}</p>
                <h2 className="contact-form-band__title">{quickDeskTitle}</h2>
                <p className="page-copy-sm text-body">{quickDeskDescription}</p>
                <div className="contact-quick-desk__actions">
                  <MarketingCtaLink
                    href="/downloads"
                    label={quickDeskPrimaryCta}
                    surface="contact-quick-desk"
                    variant="outline"
                    className="w-full justify-center sm:w-auto"
                  >
                    {quickDeskPrimaryCta}
                  </MarketingCtaLink>
                  <MarketingCtaLink
                    href="/planning"
                    label={quickDeskSecondaryCta}
                    surface="contact-quick-desk"
                    variant="primary"
                    className="w-full justify-center sm:w-auto"
                  >
                    {quickDeskSecondaryCta}
                  </MarketingCtaLink>
                </div>
              </div>
              <div>
                <CustomerQueryForm intent={intent} source={source} />
              </div>
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>
    </>
  );
}
