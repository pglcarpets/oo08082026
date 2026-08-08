"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import {
  HomeMarketingLayout,
  HomeSection,
  HomeSectionInner,
} from "@/components/home/layout";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MOTION_EASE } from "@/lib/helpers/motion";
import { Z } from "@/lib/z-index";
import { PlannerBreadcrumbs } from "./PlannerBreadcrumbs";
import { PlannerHeroDemo } from "@/components/home/PlannerHeroDemo";
import { PLANNER_FEATURE_PAGES } from "./plannerFeaturePages";
import {
  PLANNER_HERO,
  PLANNER_HERO_IMAGES,
  PLANNER_HOW_IT_WORKS,
  PLANNER_PROOF,
  PLANNER_STEPS,
} from "./plannerLandingData";

export function PlannerFeaturesHubPage() {
  return (
    <HomeMarketingLayout>
      <section className="pfp-hero-band">
        <div className="pfp-hero-media">
          <Image
            src={PLANNER_HERO_IMAGES[0].src}
            alt={PLANNER_HERO_IMAGES[0].alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="pfp-hero-overlay" />
        </div>

        <div className="home-shell-xl" style={{ zIndex: Z.canvasOverlay }}>
          <div className="pfp-hero-shell">
            <PlannerBreadcrumbs
              items={[{ label: "Planner", href: "/planner/" }, { label: "Features" }]}
            />

            <div className="pfp-hero-layout">
              <div className="pfp-hero-copy">
                <h1 className="home-hero-title-homepage mt-3 text-inverse">
                  {PLANNER_HERO.titleLead}
                  <span className="text-accent-italic-on-dark">{PLANNER_HERO.titleAccent}</span>
                </h1>
                <p className="hero-subtitle mt-5 max-w-xl text-inverse-body">
                  {PLANNER_HERO.description}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={PLANNER_HERO.primaryCta.href}
                    className="btn-hero-primary btn-primary typ-cta inline-flex gap-2 px-6 py-3"
                  >
                    {PLANNER_HERO.primaryCta.label}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href={PLANNER_HERO.secondaryCta.href}
                    className="btn-hero-secondary btn-accent typ-cta px-6 py-3"
                  >
                    {PLANNER_HERO.secondaryCta.label}
                  </Link>
                </div>

                <div className="planner-landing-hero-proof">
                  {PLANNER_PROOF.map((item) => (
                    <div key={item.label}>
                      <p className="planner-landing-proof__value">{item.value}</p>
                      <p className="planner-landing-proof__label">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  <Link href={PLANNER_HERO.featuresCta.href} className="pfp-inline-link pfp-inline-link--inverse">
                    {PLANNER_HERO.featuresCta.label}
                  </Link>
                  <Link href={PLANNER_HERO.helpCta.href} className="pfp-inline-link pfp-inline-link--inverse">
                    {PLANNER_HERO.helpCta.label}
                  </Link>
                </div>
              </div>

              <motion.div
                className="pfp-hero-demo-wrap"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease: MOTION_EASE }}
              >
                <PlannerHeroDemo />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <HomeSection variant="white" spacing="sm" className="border-t-0 py-8">
        <HomeSectionInner>
          <div className="pfp-feature-strip">
            {PLANNER_FEATURE_PAGES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.slug}
                  href={`/planner/features/${feature.slug}/`}
                  className="pfp-feature-pill group"
                >
                  <div className="flex items-start gap-3">
                    <span className="pfp-feature-pill__icon">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <h2 className="typ-h3 text-strong">{feature.tagline}</h2>
                  </div>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
          </div>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md">
        <HomeSectionInner>
          <div className="mb-8 max-w-2xl">
            <p className="typ-eyebrow text-bronze">
              {PLANNER_HOW_IT_WORKS.eyebrow}
            </p>
            <h2 id="how-it-works-heading" className="home-heading mt-3">
              {PLANNER_HOW_IT_WORKS.titleBefore}
              <span className="text-accent-italic">{PLANNER_HOW_IT_WORKS.titleAccent}</span>
              {PLANNER_HOW_IT_WORKS.titleAfter}
            </h2>
          </div>
          <div className="planner-landing-steps">
            {PLANNER_STEPS.map((item, index) => (
              <motion.div
                key={item.step}
                className="planner-landing-step"
                initial={{ y: 18 }}
                whileInView={{ y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: MOTION_EASE }}
              >
                <p className="planner-landing-step__num">{item.step}</p>
                <h3 className="typ-h3 mt-3 text-strong">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="soft" spacing="md">
        <HomeSectionInner>
          <RouteCtaBand
            title="Ready to plan your office?"
            description="Start free in guest mode, then sign in when you want to save and export."
            actions={[
              { href: PLANNER_HERO.primaryCta.href, label: "Start free", variant: "primary" },
              { href: PLANNER_HERO.secondaryCta.href, label: "Saved layouts", variant: "outline-light" },
              { href: PLANNER_HERO.helpCta.href, label: "Help", variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>
    </HomeMarketingLayout>
  );
}
