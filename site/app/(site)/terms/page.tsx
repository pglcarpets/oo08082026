import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LegalBodyReveal } from "@/components/legal/LegalBodyReveal";
import { LegalRouteHero } from "@/components/legal/LegalRouteHero";
import { QuerySectionScroll } from "@/components/legal/QuerySectionScroll";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { TERMS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = TERMS_PAGE_METADATA;

type TermsSection = { heading: string; body: string };
type ImprintSection = { heading: string; lines: string[] };

export default async function TermsPage() {
  const t = await getTranslations("legal");
  const sections = t.raw("terms.sections") as TermsSection[];
  const imprintSections = t.raw("imprint.sections") as ImprintSection[];

  return (
    <HomeMarketingLayout>
      <Suspense fallback={null}>
        <QuerySectionScroll param="section" />
      </Suspense>
      <LegalRouteHero
        title={t("terms.title")}
        subtitle={t("terms.heroSubtitle")}
        testId="terms-hero"
      />

      <div className="legal-bronze-rule" aria-hidden="true">
        <div className="legal-bronze-rule__inner home-shell-xl" />
      </div>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <LegalBodyReveal className="legal-layout grid gap-5 md:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <aside
              data-legal-reveal
              className="scheme-panel-soft scheme-border legal-aside rounded-2xl border p-6 sm:p-7 md:p-9"
            >
              <p className="typ-label text-contrast-accent">{t("terms.overviewKicker")}</p>
              <h2 className="home-heading legal-aside__title mt-3">{t("terms.overviewTitle")}</h2>
              <p className="page-copy text-body mt-4">{t("terms.overviewDescription")}</p>
              <div className="scheme-border mt-8 border-t pt-6">
                <p className="page-copy-sm text-body">{t("terms.asideGuidance")}</p>
              </div>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingCtaLink
                  href="/refund-and-return-policy"
                  label={t("terms.viewRefundPolicy")}
                  surface="terms-aside"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("terms.viewRefundPolicy")}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/service"
                  label={t("shared.serviceSupport")}
                  surface="terms-aside"
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("shared.serviceSupport")}
                </MarketingCtaLink>
              </div>
            </aside>

            <div className="space-y-4">
              {sections.map((section, index) => (
                <article
                  key={section.heading}
                  data-legal-reveal
                  className={`${
                    index === 0
                      ? "scheme-panel-dark scheme-border rounded-2xl border"
                      : "scheme-panel scheme-border rounded-2xl border"
                  } p-6 sm:p-7 md:p-8`}
                >
                  <h2 className={`typ-card ${index === 0 ? "text-inverse" : "text-strong"}`}>
                    {section.heading}
                  </h2>
                  <p
                    className={`page-copy-sm mt-3 ${
                      index === 0 ? "text-inverse-body" : "text-body"
                    }`}
                  >
                    {section.body}
                  </p>
                  {index === 0 ? (
                    <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <MarketingCtaLink
                        href="/privacy"
                        label={t("terms.privacyPolicy")}
                        surface="terms-lead"
                        variant="outline-light"
                        context="hero"
                        className="w-full justify-center sm:w-auto"
                      >
                        {t("terms.privacyPolicy")}
                      </MarketingCtaLink>
                      <MarketingCtaLink
                        href="/contact"
                        label={t("terms.askCommercialDesk")}
                        surface="terms-lead"
                        variant="primary"
                        context="hero"
                        className="w-full justify-center sm:w-auto"
                      >
                        {t("terms.askCommercialDesk")}
                      </MarketingCtaLink>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </LegalBodyReveal>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <section
            id="imprint"
            aria-labelledby="terms-imprint-heading"
            className="scheme-panel scheme-border scroll-mt-24 rounded-2xl border p-6 sm:p-7 md:p-8"
          >
            <p className="typ-label text-contrast-accent">{t("imprint.overviewKicker")}</p>
            <h2 id="terms-imprint-heading" className="home-heading mt-3">
              {t("imprint.title")}
            </h2>
            <p className="page-copy text-body mt-4">{t("imprint.overviewDescription")}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {imprintSections.map((section) => (
                <article key={section.heading} className="scheme-panel-soft scheme-border rounded-xl border p-5">
                  <h3 className="typ-card text-strong">{section.heading}</h3>
                  <ul className="page-copy-sm text-body mt-3 space-y-1">
                    {section.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={t("terms.ctaKicker")}
            title={
              <>
                {t("terms.ctaTitleLead")}{" "}
                <span className="text-accent-italic-on-dark">{t("terms.ctaTitleAccent")}</span>
              </>
            }
            description={t("terms.ctaDescription")}
            actions={[
              { href: "/contact", label: t("terms.ctaPrimary"), variant: "primary" },
              { href: "/privacy", label: t("terms.ctaSecondary"), variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>

      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
