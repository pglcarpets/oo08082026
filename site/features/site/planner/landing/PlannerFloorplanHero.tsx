"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion, type Variants } from "framer-motion";

import {
  MOTION_EASE,
  MOTION_TOKENS,
  useMotionSafeHover,
} from "@/lib/helpers/motion";
import { PlannerHeroDemo } from "@/components/home/PlannerHeroDemo";
import { PLANNER_HERO, PLANNER_PROOF } from "./plannerLandingData";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.12 } },
};

const titleVariants: Variants = {
  hidden: { y: "105%", opacity: 0, rotate: 2 },
  visible: {
    y: 0,
    opacity: 1,
    rotate: 0,
    transition: { duration: MOTION_TOKENS.slow, ease: MOTION_EASE },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: MOTION_TOKENS.distanceSm },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_TOKENS.medium, ease: MOTION_EASE },
  },
};

export function PlannerFloorplanHero() {
  const { titleLead, titleAccent, primaryCta, secondaryCta } = PLANNER_HERO;
  const primaryCtaHover = useMotionSafeHover({ scale: 1.02, y: -2 }, { scale: 0.98 });
  const secondaryCtaHover = useMotionSafeHover({ scale: 1.02, y: -2 }, { scale: 0.98 });

  return (
    <section
      id="planner-hero"
      className="planner-landing-hero home-section home-section--accent-dark home-tools-band"
    >
      <div className="home-shell-xl planner-landing-hero__inner">
        <div className="planner-landing-hero__stage">
          <motion.div
            className="planner-landing-hero__copy"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="home-hero-title-homepage planner-landing-hero__title">
              <motion.span variants={titleVariants}>
                {titleLead}
                <span className="text-accent-italic-on-dark">{titleAccent}</span>
              </motion.span>
            </h1>

            <motion.div variants={fadeUpVariants} className="home-actions planner-landing-hero__actions">
              <motion.div {...primaryCtaHover}>
                <Link href={primaryCta.href} className="btn-hero-primary btn-primary shadow-theme-panel">
                  {primaryCta.label}
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
              </motion.div>
              <motion.div {...secondaryCtaHover}>
                <Link href={secondaryCta.href} className="btn-hero-secondary btn-accent shadow-theme-panel">
                  {secondaryCta.label}
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              className="home-hero-proof-panel group typ-body-sm text-inverse planner-landing-hero-proof--row"
              variants={fadeUpVariants}
            >
              {PLANNER_PROOF.map((item) => (
                <div key={item.label} className="planner-landing-hero-proof__cell">
                  <p className="home-hero-proof-panel__lead">{item.value}</p>
                  <p className="planner-landing-hero-proof__detail text-inverse-body">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="planner-landing-hero__visual"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: MOTION_EASE }}
          >
            <Link
              href={primaryCta.href}
              className="home-tools-floor-demo home-floorplan-showcase"
              aria-label="Open Oando Planner — example 10 by 8 metre office floor plan"
              data-testid="planner-hero-floorplan"
            >
              <PlannerHeroDemo />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
