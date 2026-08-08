"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { HOMEPAGE_PARTNERSHIP_CONTENT } from "@/features/site/data/homepage";
import { useFadeUp } from "@/lib/helpers/motion";

export function PartnershipPanel() {
  const { image, title } = HOMEPAGE_PARTNERSHIP_CONTENT;
  const enter = useFadeUp(12, 0.06);

  return (
    <motion.div
      data-testid="home-partnership"
      className="home-partnership-ribbon"
      aria-label={image.alt}
      {...enter}
    >
      <Image
        src={image.src}
        alt=""
        width={224}
        height={153}
        sizes="(max-width: 768px) 9.5rem, 11.75rem"
        className="home-partnership-ribbon__logo-img"
      />
      <p className="home-partnership-ribbon__copy">
        <span className="home-partnership-ribbon__lead">{title[0]}</span>{" "}
        <span className="home-partnership-ribbon__accent">{title[1]}</span>
      </p>
    </motion.div>
  );
}

export function PartnershipBanner() {
  return (
    <section className="home-partnership-band border-t border-theme-soft">
      <div className="home-shell-xl">
        <PartnershipPanel />
      </div>
    </section>
  );
}
