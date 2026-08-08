"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import type { BusinessStats } from "@/lib/types/businessStats";
import { useStaggerMotion } from "@/lib/helpers/motion";
import { KpiCounter } from "@/components/home/KpiCounter";

interface TrustStripProps {
  stats: BusinessStats;
  embedded?: boolean;
  /**
   * `light` — homepage between light sections (default, matches historical site).
   * `inverse` — dark midnight proof band (about-style).
   */
  tone?: "light" | "inverse";
}

export function TrustStrip({
  stats,
  embedded = false,
  tone = "light",
}: TrustStripProps) {
  const t = useTranslations("home");
  const kpiLabels = t.raw("trust.kpiLabels") as string[];

  const items = [
    {
      value: stats.yearsExperience,
      label: kpiLabels[0],
      testId: "kpi-years-experience",
    },
    {
      value: stats.projectsDelivered,
      label: kpiLabels[1],
      testId: "kpi-projects-delivered",
    },
    {
      value: stats.clientOrganisations,
      label: kpiLabels[2],
      testId: "kpi-client-organisations",
    },
    {
      value: stats.locationsServed,
      label: kpiLabels[3],
      testId: "kpi-locations-served",
    },
  ];

  const inverse = tone === "inverse";
  const stagger = useStaggerMotion();

  const content = (
    <motion.div
      className={
        inverse
          ? "proof-kpi-band__grid"
          : "grid grid-cols-2 gap-4 md:grid-cols-4"
      }
      variants={stagger.container}
      initial={stagger.initial}
      whileInView={stagger.whileInView}
      viewport={{ once: true, amount: 0.25 }}
    >
      {items.map(({ value, label, testId }) => (
        <motion.div
          key={label}
          variants={stagger.item}
          className={
            inverse
              ? "proof-kpi-band__item"
              : "home-trust-kpi home-trust-kpi--light"
          }
          {...(testId ? { "data-testid": testId } : {})}
        >
          <KpiCounter
            value={value}
            className={
              inverse
                ? "proof-kpi-band__value"
                : "typ-stat text-primary"
            }
          />
          <p
            className={
              inverse ? "proof-kpi-band__label" : "typ-label mt-2 text-muted"
            }
          >
            {label}
          </p>
        </motion.div>
      ))}
    </motion.div>
  );

  if (embedded) {
    return content;
  }

  if (inverse) {
    return (
      <section
        data-testid="home-trust"
        aria-label="Business metrics"
        className="proof-kpi-band"
      >
        <div className="home-shell-xl">{content}</div>
      </section>
    );
  }

  /* Homepage default: light band between sections (historical look). */
  return (
    <section
      data-testid="home-trust"
      aria-label="Business metrics"
      className="home-trust-band-light home-section--white w-full border-y border-theme-soft section-y-sm"
    >
      <div className="home-shell-xl">{content}</div>
    </section>
  );
}
