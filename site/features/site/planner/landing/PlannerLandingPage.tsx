"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { HomeMarketingLayout } from "@/components/home/layout";
import { MOTION_EASE, hoverLift, staggerContainer, staggerItem } from "@/lib/helpers/motion";
import { PlannerFloorplanHero } from "./PlannerFloorplanHero";
import { PLANNER_LANDING_ICONS } from "./plannerLandingIcons";
import { PLANNER_HERO, PLANNER_LANDING_FEATURES, PLANNER_STEPS } from "./plannerLandingData";

export function PlannerLandingPage() {
  return (
    <HomeMarketingLayout>
      <PlannerFloorplanHero />

      <section className="home-section--soft border-t border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="home-heading">
              Built for{" "}
              <span className="text-accent-italic">office teams</span>
            </h2>
            <Link
              href={PLANNER_HERO.featuresCta.href}
              className="planner-landing-features-link typ-label inline-flex shrink-0 gap-2 text-muted hover:text-strong"
            >
              {PLANNER_HERO.featuresCta.label}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </div>
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {PLANNER_LANDING_FEATURES.map((feature) => {
              const Icon = PLANNER_LANDING_ICONS[feature.slug];
              return (
                <motion.div key={feature.slug} variants={staggerItem}>
                  <Link href={feature.href} className="">
                    <motion.div
                      className="home-tool-card home-why-card group text-center"
                      variants={hoverLift}
                      initial="rest"
                      whileHover="hover"
                    >
                      <span className="planner-landing-feature__icon home-why-icon">
                        {Icon ? <Icon size={28} weight="duotone" aria-hidden="true" /> : null}
                      </span>
                      <h3 className="home-why-card__title">{feature.title}</h3>
                      <p className="home-why-card__tagline">{feature.tagline}</p>
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section className="home-section--white border-t border-theme-soft section-y-sm">
        <motion.div
          className="home-shell-xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.7, ease: MOTION_EASE }}
        >
          <div className="mb-8 max-w-2xl">
            <h2 className="home-heading">
              Blank floor to{" "}
              <span className="text-accent-italic">shareable</span> layout
            </h2>
          </div>
          <motion.div
            className="planner-landing-steps"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {PLANNER_STEPS.map((item) => (
              <motion.div key={item.step} variants={staggerItem} className="h-full">
                <article className="planner-landing-step h-full">
                  <p className="planner-landing-step__num">{item.step}</p>
                  <h3 className="typ-h3 mt-3 text-strong">{item.title}</h3>
                </article>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>
    </HomeMarketingLayout>
  );
}
