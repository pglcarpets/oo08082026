"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react";
import type { Variants } from "framer-motion";
import { motion, useScroll, useTransform } from "framer-motion";

import { TrackedLink } from "@/components/ui/TrackedLink";
import { DEFAULT_HERO_FALLBACK } from "@/features/site/data/homepage";

export interface HeroProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: "default" | "small" | "cinema";
  backgroundImage?: string;
  showButton?: boolean;
  buttonText?: string;
  buttonLink?: string;
  sectionId?: string;
  className?: string;
  imageClassName?: string;
  contentClassName?: string;
  overlayClassName?: string;
}

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

export function Hero({
  title,
  subtitle,
  variant = "default",
  backgroundImage,
  showButton = true,
  buttonText = "Discover office furniture",
  buttonLink = "/products",
  sectionId = "page-hero",
  className = "",
  imageClassName = "",
  contentClassName = "",
  overlayClassName = "",
}: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [motionReady, setMotionReady] = useState(false);
  const [backgroundImageFailed, setBackgroundImageFailed] = useState(false);
  const requestedBackgroundImage = backgroundImage || null;
  const normalizedBackgroundImage =
    backgroundImageFailed && requestedBackgroundImage !== DEFAULT_HERO_FALLBACK
      ? DEFAULT_HERO_FALLBACK
      : requestedBackgroundImage;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const yParallax = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const isSmall = variant === "small";
  const isCinema = variant === "cinema";

  const getHeightClass = () => {
    // Route landings (small): compact band — not a second homepage cinema hero.
    if (isSmall) {
      return "h-auto min-h-[11rem] max-h-[18rem] md:min-h-[12.5rem] md:max-h-[20rem]";
    }
    if (isCinema) {return "h-[85vh] md:h-screen md:min-h-[61.25rem]";}
    return "h-[78vh] md:h-screen";
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <section
      id={sectionId}
      ref={containerRef}
      className={`scheme-panel-dark relative w-full overflow-hidden group hero-section ${getHeightClass()}${isSmall ? " page-hero" : ""} ${className}`.trim()}
    >
      {/* Parallax Background */}
      <motion.div
        style={{ y: yParallax, opacity: opacityFade }}
        className="absolute inset-0 w-full h-[130%] -top-[15%]"
      >
        {normalizedBackgroundImage ? (
          <Image
            src={normalizedBackgroundImage}
            alt=""
            aria-hidden="true"
            fill
            sizes="100vw"
            className={`object-cover scale-105 ${imageClassName}`.trim()}
            priority
            onError={() => setBackgroundImageFailed(true)}
          />
        ) : (
          <div className="w-full h-full" />
        )}

        <div className={`absolute inset-0 home-hero-overlay-strong ${overlayClassName}`.trim()} />
        <div className="absolute inset-0 surface-overlay-inverse-12" />
      </motion.div>

      {/* Content Container */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end">
        <div
          className={
            isSmall
              ? // Route heroes use home-shell-xl (same inset as body sections).
                // Do not use home-hero__layout — that grid is for homepage cinema only.
                `home-shell-xl relative z-10 flex min-h-full flex-col justify-center section-y-hero text-start ${contentClassName}`.trim()
              : "container flex h-full flex-col items-start justify-center pb-20 pt-32 text-start"
          }
        >
          <motion.div
            variants={containerVariants}
            initial={motionReady ? "hidden" : false}
            animate={motionReady ? "visible" : false}
            className={
              isSmall
                ? "w-full max-w-[44rem] space-y-5 self-start text-start"
                : "w-full max-w-[44rem] self-start space-y-7 text-start"
            }
          >
            {/* overflow visible — hidden clipped/warped large display H1s (descenders + balance wrap). */}
            <motion.div variants={titleVariants} className="overflow-visible">
              <h1
                className={
                  isSmall
                    ? "home-hero-title-route page-hero-title text-inverse text-start"
                    : "hero-title home-hero-title-default text-inverse text-start"
                }
              >
                {title || (
                  <>
                    Create your <br />
                    <span className="hero-accent text-inverse-muted">
                      best work.
                    </span>
                  </>
                )}
              </h1>
            </motion.div>

            {subtitle && (
              <motion.p
                variants={titleVariants}
                className="hero-subtitle text-inverse-body max-w-3xl text-start"
              >
                {subtitle}
              </motion.p>
            )}

            {showButton && (
              <motion.div variants={titleVariants} className="pt-6">
                <TrackedLink
                  href={buttonLink}
                  label={buttonText}
                  surface={`route-hero:${sectionId}`}
                  className="btn-primary group min-h-11 px-8 py-4 md:px-10"
                >
                  <span className="text-sm font-bold uppercase tracking-wide">
                    {buttonText}
                  </span>
                  <ArrowRight
                    className="h-5 w-5 transition-transform group-hover:translate-x-2"
                    aria-hidden="true"
                  />
                </TrackedLink>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

    </section>
  );
}
