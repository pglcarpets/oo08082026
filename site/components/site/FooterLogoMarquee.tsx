"use client";

import Image from "next/image";
import { HOMEPAGE_TRUST_CONTENT } from "@/features/site/data/homepage";

/**
 * Decorative client-logo track above the footer.
 * Contained on phone: max-w-full + overflow-hidden shells so w-max track cannot crush layout.
 */
export function FooterLogoMarquee() {
  const trackLogos = [...HOMEPAGE_TRUST_CONTENT.logos, ...HOMEPAGE_TRUST_CONTENT.logos];

  return (
    <section
      aria-hidden="true"
      className="footer-logo-marquee w-full max-w-full min-w-0 overflow-hidden border-y border-soft bg-panel py-3 md:py-5"
      style={{ ["--marquee-duration" as string]: "110s" }}
    >
      <div className="relative max-w-full min-w-0 overflow-hidden">
        {/* Track animation: marquee-left + --marquee-duration (see home-media-layers.css).
            Do not add animate-marquee — it hardcodes 30s and fights the duration token. */}
        <div className="footer-logo-marquee__track flex w-max max-w-none motion-reduce:animate-none">
          {trackLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="footer-logo-marquee__item relative h-10 w-28 shrink-0 sm:h-12 sm:w-32 md:h-16 md:w-44"
            >
              <Image
                src={logo.src}
                alt=""
                fill
                sizes="(max-width: 640px) 112px, (max-width: 768px) 128px, 176px"
                className="footer-logo-marquee__logo object-contain opacity-100 saturate-100 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-110 motion-reduce:hover:scale-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
