import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import "./globals.css";
import QueryProvider from "@/app/(site)/providers/QueryProvider";
import { SITE_URL } from "@/lib/siteUrl";
import { buildGlobalJsonLd, buildSiteMetadata } from "@/lib/analytics/seo";
import { SITE_VIEWPORT } from "@/lib/siteViewport";
import { QuoteCartChrome } from "@/components/site/QuoteCartChrome";
import { RouteChromeSuspense } from "@/components/site/RouteChromeSuspense";
import { SiteErrorBoundary } from "@/components/site/SiteErrorBoundary";
import { getSiteLayoutContext } from "@/lib/layout/siteLayoutContext";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

export const metadata: Metadata = buildSiteMetadata(SITE_URL);

export const viewport: Viewport = {
  ...SITE_VIEWPORT,
  themeColor: "var(--color-ocean-boat-blue-900)",
};

const SITEWIDE_JSON_LD = buildGlobalJsonLd(SITE_URL.replace(/\/+$/, ""));

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { messages, locale } = await getSiteLayoutContext();

  return (
    <SiteErrorBoundary>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <QueryProvider>
          {/*
            Sitewide Organization + WebSite + FurnitureStore graph for main marketing
            surface. Product/admin shells use their own layouts (no this JSON-LD).
          */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: sanitizeJsonForScript(SITEWIDE_JSON_LD),
            }}
          />
          {/*
            Bypass block (WCAG 2.4.1). #main-content already existed as a target, but
            nothing ever linked to it: the first tab stop was the logo, leaving keyboard
            and screen-reader users to walk ~22 header/nav stops on every page before
            reaching content. Must be the first focusable element in the DOM.
          */}
          <a href="#main-content" className="site-skip-link">
            Skip to main content
          </a>
          <RouteChromeSuspense position="top" />
          {/* Fixed SiteHeader is h-16 (4rem) — keep page content below chrome. */}
          <main id="main-content" className="site-main-under-header">
            {children}
          </main>
          <RouteChromeSuspense position="bottom" />
          <QuoteCartChrome />
        </QueryProvider>
      </NextIntlClientProvider>
    </SiteErrorBoundary>
  );
}
