"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { ADMIN_ENTRY_HERO_MEDIA } from "@/features/admin/dashboard/adminEntryContent";
import { normalizeAssetPath } from "@/lib/assetPaths";

import { AccessForm } from "./AccessForm";

registerGsapPlugins();

export type AccessSignInViewProps = {
  backToHomeLabel: string;
  accessPanelTitle: string;
  accessPanelDescription: string;
  nextPath: string;
  guestHref: string;
  requiresAdmin: boolean;
};

export function AccessSignInView({
  backToHomeLabel,
  accessPanelTitle,
  accessPanelDescription,
  nextPath,
  guestHref,
  requiresAdmin,
}: AccessSignInViewProps) {
  const accessPoster =
    normalizeAssetPath(ADMIN_ENTRY_HERO_MEDIA.poster) ??
    ADMIN_ENTRY_HERO_MEDIA.poster;
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !rootRef.current) {
        return;
      }

      const targets = rootRef.current.querySelectorAll("[data-access-reveal]");
      if (!targets.length) {
        return;
      }

      const ctx = gsap.context(() => {
        gsap.from(targets, {
          y: GSAP_REVEAL.y,
          opacity: GSAP_REVEAL.opacity,
          duration: GSAP_REVEAL.duration,
          stagger: GSAP_REVEAL.stagger,
          ease: GSAP_EASE_OUT,
        });
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef, dependencies: [] },
  );

  return (
    <div ref={rootRef} className="shell-access-page" data-testid="access-sign-in-page">
      <div className="shell-access-form-side">
        <div className="shell-access-back">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-strong"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backToHomeLabel}
          </Link>
        </div>

        <div className="shell-access-form-wrap">
          <div data-access-reveal className="shell-access-form-panel">
            <Link
              href="/"
              className="mb-6 inline-flex"
              aria-label="One&Only home"
            >
              <OneAndOnlyLogo variant="orange" className="h-9 max-w-44" />
            </Link>
            <AccessForm
              nextPath={nextPath}
              guestHref={guestHref}
              requiresAdmin={requiresAdmin}
            />
          </div>
        </div>
      </div>

      <div className="shell-access-visual-side scheme-panel-soft">
        <div
          className="shell-access-visual-poster"
          style={{ backgroundImage: `url(${accessPoster})` }}
          aria-hidden="true"
        />
        <div className="shell-access-visual-grid" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="shell-access-architectural-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#shell-access-architectural-grid)" />
            <line x1="0" y1="200" x2="100%" y2="200" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <line x1="300" y1="0" x2="300" y2="100%" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <circle cx="300" cy="200" r="8" fill="currentColor" />
          </svg>
        </div>
        <div className="shell-access-visual-rule" aria-hidden="true" />
        <div className="shell-access-visual-copy">
          <div data-access-reveal className="shell-access-visual-panel">
            <h2 className="typ-h3 mb-3">{accessPanelTitle}</h2>
            <p className="page-copy-sm text-muted">{accessPanelDescription}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
