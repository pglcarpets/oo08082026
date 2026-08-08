"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { OneAndOnlyLogo } from "@/components/ui/Logo";
import { LanguageSwitcher } from "@/components/site/LanguageSwitcher";
import {
  buildMailtoHref,
  formatSitePostalAddress,
  SITE_CONTACT,
  toTelHref,
} from "@/features/site/data/contact";
import { SITE_FOOTER_NAV, SITE_SOCIAL_LINKS } from "@/features/site/data/navigation";

import { Envelope, Phone } from "@phosphor-icons/react";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M23.5 6.2a3.1 3.1 0 0 0-2.2-2.2C19.4 3.5 12 3.5 12 3.5s-7.4 0-9.3.5A3.1 3.1 0 0 0 .5 6.2 32 32 0 0 0 0 12a32 32 0 0 0 .5 5.8 3.1 3.1 0 0 0 2.2 2.2c1.9.5 9.3.5 9.3.5s7.4 0 9.3-.5a3.1 3.1 0 0 0 2.2-2.2A32 32 0 0 0 24 12a32 32 0 0 0-.5-5.8zM9.6 15.5V8.5L15.8 12 9.6 15.5z" />
    </svg>
  );
}

const SOCIAL_ICON_MAP: Record<string, () => React.JSX.Element> = {
  facebook: FacebookIcon,
  youtube: YouTubeIcon,
};

/** Shared focus + hover chrome for footer controls. */
const footerInteractiveClass =
  "rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

/** ≥44px text links (phone, email, nav, legal). */
const footerTextLinkClass = `site-footer__link ${footerInteractiveClass} inline-flex items-center gap-2 py-1`;

/** Social targets. */
const footerSocialClass = `site-footer__social ${footerInteractiveClass} inline-flex h-9 w-9 items-center justify-center rounded-full bg-soft text-inverse hover:text-primary hover:bg-soft-hover transition-all`;

export function SiteFooter() {
  // useSyncExternalStore guarantees the same snapshot is used for SSR and
  // hydration, eliminating the classic new Date() hydration mismatch that
  // occurs when server and client clocks disagree (year boundary, timezone).
  const currentYear = useSyncExternalStore(
    () => () => {},
    () => new Date().getFullYear(),
    () => new Date().getFullYear(),
  );

  return (
    <footer className="site-footer w-full surface-inverse text-inverse">
      {/* home-shell-xl matches marketing body insets (shell-container is wider/off-axis). */}
      <div className="home-shell-xl py-8 md:py-10">
        <div className="site-footer__columns">
          <div className="site-footer__brand-col flex min-w-0 flex-col gap-4">
            <Link
              href="/"
              prefetch={false}
              aria-label="One&Only - home"
              className={`${footerTextLinkClass}`}
            >
              <OneAndOnlyLogo variant="orange" className="h-9" />
            </Link>

            <div className="site-footer__contact-stack flex flex-col gap-2">
              <address className="site-footer__address site-footer__contact-line whitespace-pre-line not-italic text-sm leading-relaxed">
                {formatSitePostalAddress()}
              </address>
              <a
                href={toTelHref(SITE_CONTACT.supportPhone)}
                className={`site-footer__contact-line ${footerTextLinkClass} text-sm`}
              >
                <Phone size={16} className="shrink-0 text-primary" aria-hidden="true" />
                <span>+91 90310 22875</span>
              </a>
              <a
                href={buildMailtoHref()}
                className={`site-footer__contact-line ${footerTextLinkClass} text-sm`}
              >
                <Envelope size={16} className="shrink-0 text-primary" aria-hidden="true" />
                <span>{SITE_CONTACT.salesEmail}</span>
              </a>
              <div className="site-footer__social-row flex flex-wrap items-center gap-2 pt-2">
                {SITE_SOCIAL_LINKS.map((social) => {
                  const Icon = SOCIAL_ICON_MAP[social.id];
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      aria-label={social.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={footerSocialClass}
                    >
                      {Icon ? <Icon /> : null}
                    </a>
                  );
                })}
              </div>
              <div className="pt-1">
                <LanguageSwitcher />
              </div>
            </div>
          </div>

          {SITE_FOOTER_NAV.map((col, index) => (
            <div
              key={col.heading}
              className={`site-footer__nav-col min-w-0 ${
                index === 0 ? "site-footer__nav-col--products" : ""
              } ${index === 1 ? "site-footer__nav-col--company" : ""} ${
                index === 2 ? "site-footer__nav-col--services" : ""
              }`.trim()}
            >
              <p className="site-footer__heading site-footer__nav-heading typ-overline mb-2 md:mb-3">
                {col.heading}
              </p>
              <ul className="flex flex-col gap-0.5">
                {col.links.map(({ href, label }) => (
                  <li key={`${href}-${label}`}>
                    <Link
                      href={href}
                      prefetch={false}
                      className={`${footerTextLinkClass} typ-body-sm`}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="site-footer__divider mt-2 border-t">
        <div className="site-footer__legal-row typ-body-sm home-shell-xl py-5">
          <div className="site-footer__legal-links">
            <Link
              href="/refund-and-return-policy"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-11 items-center`}
            >
              Refund Policy
            </Link>
            <Link
              href="/privacy"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-11 items-center`}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-11 items-center`}
            >
              Terms
            </Link>
            <Link
              href="/sitemap"
              prefetch={false}
              className={`site-footer__legal ${footerInteractiveClass} inline-flex min-h-11 items-center`}
            >
              Sitemap
            </Link>
          </div>
          <p className="site-footer__legal-copy mt-3">
            &copy; <span suppressHydrationWarning>{currentYear}</span> One&Only. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
