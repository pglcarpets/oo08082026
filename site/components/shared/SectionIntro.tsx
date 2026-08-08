"use client";

import { motion } from "framer-motion";
import { useFadeUp } from "@/lib/helpers/motion";

interface SectionIntroProps {
  kicker?: string;
  title: string;
  /** Optional stressed phrase rendered in the canonical italic-bronze accent. */
  titleAccent?: string;
  description?: string;
  className?: string;
  maxWidthClassName?: string;
  /**
   * Title type scale. Use `subsection` under a page Hero so the intro
   * does not compete as a second page-level heading.
   */
  titleSize?: "page" | "subsection";
  /** Set when the intro sits on a dark/inverse surface. */
  tone?: "light" | "dark";
}

export function SectionIntro({
  kicker,
  title,
  titleAccent,
  description,
  className = "",
  maxWidthClassName = "max-w-3xl",
  titleSize = "page",
  tone = "light",
}: SectionIntroProps) {
  const isDark = tone === "dark";
  const titleClass =
    titleSize === "subsection"
      ? `typ-subsection-title ${isDark ? "text-inverse" : "text-heading"}`
      : `home-heading ${isDark ? "text-inverse" : ""}`;
  const enter = useFadeUp(16, 0.04);

  return (
    <motion.div
      className={`section-intro ${maxWidthClassName} ${className}`.trim()}
      {...enter}
    >
      {kicker ? (
        <p className={`typ-label mb-4 ${isDark ? "text-inverse-muted" : "text-body"}`}>{kicker}</p>
      ) : null}
      <h2 className={titleClass}>
        {title}
        {titleAccent ? (
          <>
            {" "}
            <span className={isDark ? "text-accent-italic-on-dark" : "text-accent-italic"}>
              {titleAccent}
            </span>
          </>
        ) : null}
      </h2>
      {description ? (
        <p className={`page-copy mt-5 ${isDark ? "text-inverse-body" : "text-body"}`}>
          {description}
        </p>
      ) : null}
    </motion.div>
  );
}
