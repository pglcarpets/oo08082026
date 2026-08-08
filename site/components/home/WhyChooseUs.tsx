"use client";

import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { Gauge, Plant, ShieldCheck, Stack } from "@phosphor-icons/react";
import {
  hoverLift,
  useFadeUp,
  useStaggerMotion,
} from "@/lib/helpers/motion";

const iconMap = [Gauge, ShieldCheck, Plant, Stack] as const;
const iconClassMap = [
  "home-feature-icon--ocean",
  "home-feature-icon--bronze",
  "home-feature-icon--sustain",
  "home-feature-icon--taupe",
] as const;

interface Feature {
  title: string;
  tagline: string;
}

export function WhyChooseUs() {
  const t = useTranslations("home");
  const titleLead = t("whyChooseUs.titleLead");
  const titleAccent = t("whyChooseUs.titleAccent");
  const features = t.raw("whyChooseUs.features") as Feature[];
  const intro = useFadeUp();
  const stagger = useStaggerMotion();
  const reduceMotion = useReducedMotion();

  return (
    <section
      data-testid="home-why"
      className="home-section--white border-t border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">
        <motion.div className="mb-10 max-w-3xl" {...intro}>
          <h2 className="home-heading">
            {titleLead}{" "}
            <span className="text-accent-italic">{titleAccent}</span>
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4"
          variants={stagger.container}
          initial={stagger.initial}
          whileInView={stagger.whileInView}
          viewport={{ once: true, amount: 0.2 }}
        >
          {features.map((feature, index) => {
            const Icon = iconMap[index] ?? Gauge;
            const iconClass = iconClassMap[index] ?? iconClassMap[0];
            return (
              <motion.div key={feature.title} variants={stagger.item}>
                <motion.div
                  className="home-tool-card home-why-card group flex h-full flex-col items-center text-center"
                  variants={reduceMotion ? undefined : hoverLift}
                  initial={reduceMotion ? undefined : "rest"}
                  whileHover={reduceMotion ? undefined : "hover"}
                >
                  <span className={`home-why-icon ${iconClass}`}>
                    <Icon size={34} weight="duotone" aria-hidden="true" />
                  </span>
                  <h3 className="home-why-card__title">{feature.title}</h3>
                  <p className="home-why-card__tagline">{feature.tagline}</p>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
