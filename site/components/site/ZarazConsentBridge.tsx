"use client";

/**
 * Bridges first-party cookie consent → Cloudflare Zaraz (when present).
 *
 * Zaraz is auto-injected by Cloudflare (cdn-cgi/zaraz/s.js), not by this app.
 * Our CSP intentionally blocks Google DoubleClick beacons; this bridge still
 * tells Zaraz Consent / Google Consent Mode the user's choice so tools that
 * respect consent stay quiet until accept.
 *
 * Dashboard (required for full effect):
 * - Zaraz → Consent: enable and map tools to purposes
 * - Prefer removing unused GA property G-CTPK6318CR if CSP will keep blocking it
 *
 * @see https://developers.cloudflare.com/zaraz/consent-management/
 */
import { useEffect } from "react";
import {
  CONSENT_ACCEPTED,
  CONSENT_COOKIE,
  CONSENT_REJECTED,
  hasAnalyticsConsent,
} from "@/lib/consent";

type ZarazConsentApi = {
  setAll?: (allowed: boolean) => void;
  set?: (purposeId: string, allowed: boolean) => void;
};

type ZarazGlobal = {
  consent?: ZarazConsentApi;
  set?: (key: string, value: unknown) => void;
};

declare global {
  interface Window {
    zaraz?: ZarazGlobal;
  }
}

function readConsentCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${CONSENT_COOKIE}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(prefix.length));
}

function applyZarazConsent(allowed: boolean): void {
  if (typeof window === "undefined") return;
  const zaraz = window.zaraz;
  if (!zaraz) return;

  try {
    zaraz.consent?.setAll?.(allowed);
  } catch {
    // Zaraz Consent module may be off in the dashboard.
  }

  try {
    // Google Consent Mode v2 signals some Zaraz Google tools honor.
    zaraz.set?.("google_consent_default", {
      ad_storage: allowed ? "granted" : "denied",
      ad_user_data: allowed ? "granted" : "denied",
      ad_personalization: allowed ? "granted" : "denied",
      analytics_storage: allowed ? "granted" : "denied",
    });
  } catch {
    // Optional path.
  }
}

export function ZarazConsentBridge() {
  useEffect(() => {
    const cookie = readConsentCookie();
    if (cookie === CONSENT_ACCEPTED) {
      applyZarazConsent(true);
    } else if (cookie === CONSENT_REJECTED) {
      applyZarazConsent(false);
    } else {
      // No choice yet — deny optional marketing until Accept (or timed accept).
      applyZarazConsent(false);
    }

    const onConsent = (event: Event) => {
      const detail = (event as CustomEvent<{ value?: string }>).detail;
      const value = detail?.value;
      if (value === CONSENT_ACCEPTED) {
        applyZarazConsent(true);
        return;
      }
      if (value === CONSENT_REJECTED) {
        applyZarazConsent(false);
        return;
      }
      applyZarazConsent(hasAnalyticsConsent());
    };

    window.addEventListener("oando-cookie-consent", onConsent as EventListener);
    return () => {
      window.removeEventListener("oando-cookie-consent", onConsent as EventListener);
    };
  }, []);

  return null;
}
