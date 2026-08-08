"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const CONSENT_COOKIE = "oando_cookie_consent";
const CONSENT_ACCEPTED = "accepted";
const CONSENT_REJECTED = "rejected";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days

const SEO_COOKIE_KEYS = [
  "oando_seo_landing",
  "oando_seo_referrer",
  "oando_seo_source",
  "oando_seo_medium",
  "oando_seo_campaign",
  "oando_seo_term",
  "oando_seo_content",
  "oando_seo_locale",
] as const;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {return null;}
  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) {return null;}
  return decodeURIComponent(entry.slice(prefix.length));
}

function writeCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {return;}
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {return;}
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`;
}

function inferSource(referrer: string): string {
  const host = referrer.toLowerCase();
  if (!host) {return "direct";}
  if (host.includes("google.")) {return "google";}
  if (host.includes("bing.")) {return "bing";}
  if (host.includes("yahoo.")) {return "yahoo";}
  if (host.includes("duckduckgo.")) {return "duckduckgo";}
  if (host.includes("instagram.")) {return "instagram";}
  if (host.includes("facebook.")) {return "facebook";}
  if (host.includes("linkedin.")) {return "linkedin";}

  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "referral";
  }
}

function setSeoCookies() {
  if (typeof window === "undefined") {return;}

  const params = new URLSearchParams(window.location.search);
  const landing = `${window.location.pathname}${window.location.search}`.slice(0, 512);
  const referrer = document.referrer || "direct";
  const source = (params.get("utm_source") || inferSource(referrer)).slice(0, 100);
  const medium = (params.get("utm_medium") || (source === "direct" ? "none" : "referral")).slice(
    0,
    100,
  );
  const campaign = (params.get("utm_campaign") || "").slice(0, 120);
  const term = (params.get("utm_term") || "").slice(0, 120);
  const content = (params.get("utm_content") || "").slice(0, 120);
  const locale = document.documentElement.lang || "en-IN";

  writeCookie("oando_seo_landing", landing, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_referrer", referrer.slice(0, 512), COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_source", source, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_medium", medium, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_campaign", campaign, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_term", term, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_content", content, COOKIE_MAX_AGE_SECONDS);
  writeCookie("oando_seo_locale", locale.slice(0, 20), COOKIE_MAX_AGE_SECONDS);
}

function clearSeoCookies() {
  for (const key of SEO_COOKIE_KEYS) {
    clearCookie(key);
  }
}

const consentBarClass =
  "fixed inset-x-0 bottom-0 z-[45] border-t border-soft surface-overlay-95 backdrop-blur [box-shadow:0_-18px_40px_-30px_var(--overlay-inverse-35)] [animation:consent-slide-in_0.32s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:[animation:none]";
const consentCopyClass =
  "max-w-3xl text-body md:text-sm md:leading-relaxed [font-size:var(--type-body-size)] [font-weight:375] [letter-spacing:var(--type-letter-copy)] [line-height:1.6]";
const consentActionBaseClass =
  "min-h-9 rounded-full px-2.5 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-10 sm:px-3 md:min-h-11 md:px-4 md:text-sm [font-size:var(--type-label-size)] sm:[font-size:var(--type-body-size)] [letter-spacing:var(--type-letter-copy)] [line-height:1.6]";
const consentSecondaryActionClass =
  "border border-muted text-body hover:border-strong hover:text-strong";
const consentPrimaryActionClass = "bg-primary text-inverse hover:bg-primary/90";

export function CookieConsentBar() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const consent = useSyncExternalStore(
    () => () => {},
    () => readCookie(CONSENT_COOKIE),
    () => null,
  );

  useEffect(() => {
    if (consent === CONSENT_ACCEPTED) {
      setSeoCookies();
    }
  }, [consent]);

  useEffect(() => {
    if (dismissed || consent) {
      setVisible(false);
      return;
    }

    const showTimer = window.setTimeout(() => {
      setVisible(true);
    }, 2500);

    return () => window.clearTimeout(showTimer);
  }, [consent, dismissed]);

  useEffect(() => {
    if (dismissed || consent || !visible) {return;}

    const timer = window.setTimeout(() => {
      writeCookie(CONSENT_COOKIE, CONSENT_ACCEPTED, COOKIE_MAX_AGE_SECONDS);
      setSeoCookies();
      window.dispatchEvent(
        new CustomEvent("oando-cookie-consent", { detail: { value: CONSENT_ACCEPTED } }),
      );
      void import("@/lib/analytics/siteEvents").then((mod) => {
        mod.flushAnalyticsAfterConsent();
      });
      setDismissed(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [consent, dismissed, visible]);

  const acceptAll = () => {
    writeCookie(CONSENT_COOKIE, CONSENT_ACCEPTED, COOKIE_MAX_AGE_SECONDS);
    setSeoCookies();
    window.dispatchEvent(
      new CustomEvent("oando-cookie-consent", { detail: { value: CONSENT_ACCEPTED } }),
    );
    // Flush events that fired before Accept (page_view, CTA, planner entry).
    void import("@/lib/analytics/siteEvents").then((mod) => {
      mod.flushAnalyticsAfterConsent();
    });
    setDismissed(true);
  };

  const rejectOptional = () => {
    writeCookie(CONSENT_COOKIE, CONSENT_REJECTED, COOKIE_MAX_AGE_SECONDS);
    clearSeoCookies();
    window.dispatchEvent(
      new CustomEvent("oando-cookie-consent", { detail: { value: CONSENT_REJECTED } }),
    );
    setDismissed(true);
  };

  if (dismissed || consent || !visible) {return null;}

  return (
    <section
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-dialog-title"
      aria-describedby="cookie-dialog-desc"
      data-cookie-consent-bar
      className={`${consentBarClass} pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]`}
    >
      <div className="shell-container px-4 py-2.5 sm:px-6 sm:py-3 md:py-4 2xl:px-0">
        <div className="mx-auto flex max-w-6xl min-w-0 flex-col gap-2.5 sm:gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <p id="cookie-dialog-desc" className={`${consentCopyClass} min-w-0 text-pretty sm:text-balance`}>
            <span id="cookie-dialog-title" className="sr-only">Cookie preferences</span>
            <span className="sm:hidden">
              Essential cookies only unless you accept optional analytics.{" "}
            </span>
            <span className="hidden sm:inline">
              We use essential cookies and optional analytics & attribution cookies to improve
              discoverability and user journeys.{" "}
            </span>
            See our{" "}
          <Link href="/privacy" prefetch={false} className="font-semibold text-primary hover:underline">
            privacy notice
          </Link>
            .
          </p>
          <div className="grid w-full shrink-0 grid-cols-2 gap-2 md:flex md:w-auto md:flex-row">
            <button
              type="button"
              onClick={rejectOptional}
              aria-label="Reject non-essential cookies"
              className={`${consentActionBaseClass} ${consentSecondaryActionClass} px-2 sm:px-3`}
            >
              <span className="sm:hidden">Reject</span>
              <span className="hidden sm:inline">Reject Non-Essential</span>
            </button>
            <button
              type="button"
              onClick={acceptAll}
              aria-label="Accept all cookies"
              className={`${consentActionBaseClass} ${consentPrimaryActionClass} px-2 sm:px-3`}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

