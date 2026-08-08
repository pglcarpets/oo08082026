"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import ReloadButton from "@/app/offline/ReloadButton";

registerGsapPlugins();

export type OfflinePageViewProps = {
  isMaintenance: boolean;
};

/** Utility offline / maintenance shell — poster ambient only (no video). */
export function OfflinePageView({ isMaintenance }: OfflinePageViewProps) {
  const panelRef = useRef<HTMLElement>(null);
  const [motionReady, setMotionReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMotionReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useGSAP(
    () => {
      if (!motionReady || gsapReducedMotion() || !panelRef.current) {
        return;
      }

      const targets = panelRef.current.querySelectorAll("[data-offline-reveal]");
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
      }, panelRef);

      return () => ctx.revert();
    },
    { scope: panelRef, dependencies: [motionReady, isMaintenance] },
  );

  return (
    <div className="site-error" data-testid="offline-page">
      <div className="site-error__ambient" aria-hidden="true" />
      <main ref={panelRef} className="site-error__panel">
        <div
          data-offline-reveal
          className="site-error__brand"
          data-testid="offline-brand"
        >
          <OneAndOnlyLogo variant="orange" className="mx-auto h-9 max-w-44" />
        </div>
        <p data-offline-reveal className="typ-eyebrow site-error__kicker">
          {isMaintenance ? "Platform status" : "Connection"}
        </p>
        <h1 data-offline-reveal className="site-error__title">
          {isMaintenance ? "Read-only maintenance" : "You are offline"}
        </h1>
        <p data-offline-reveal className="site-error__copy">
          {isMaintenance
            ? "Admin and cloud saves are paused while we restore database connectivity. Public catalog browsing and local planner drafts still work."
            : "We cannot reach the network right now. Any cached pages you have visited will still be available. Please reconnect to continue."}
        </p>
        <div data-offline-reveal className="site-error__actions">
          {!isMaintenance ? <ReloadButton /> : null}
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
