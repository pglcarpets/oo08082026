import { getTranslations } from "next-intl/server";
import { LegalBodyReveal } from "@/components/legal/LegalBodyReveal";
import { LegalRouteHero } from "@/components/legal/LegalRouteHero";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { REFUND_POLICY_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = REFUND_POLICY_PAGE_METADATA;

type RefundSection = {
  title: string;
  tone: string;
  items: string[];
  contactLines?: string[];
};

export default async function RefundAndReturnPolicyPage() {
  const t = await getTranslations("legal");
  const sections = t.raw("refund.sections") as RefundSection[];

  return (
    <HomeMarketingLayout>
      <LegalRouteHero
        title={t("refund.heroTitle")}
        subtitle={t("refund.heroSubtitle")}
        testId="refund-hero"
      />

      <div className="legal-bronze-rule" aria-hidden="true">
        <div className="legal-bronze-rule__inner home-shell-xl" />
      </div>

      <HomeSection variant="white" spacing="md" className="border-t-0">
        <HomeSectionInner>
          <LegalBodyReveal className="legal-layout grid gap-5 md:gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <aside
              data-legal-reveal
              className="scheme-panel-dark scheme-border legal-aside rounded-2xl border p-6 sm:p-7 md:p-9"
            >
              <p className="typ-label text-inverse-muted">{t("refund.overviewKicker")}</p>
              <h2 className="home-heading legal-aside__title mt-3 text-inverse">
                {t("refund.overviewTitle")}
              </h2>
              <p className="page-copy text-inverse-body mt-4">{t("refund.overviewDescription")}</p>
              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingCtaLink
                  href="/contact"
                  label={t("refund.contactSalesDesk")}
                  surface="refund-aside"
                  variant="primary"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("refund.contactSalesDesk")}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/service"
                  label={t("shared.serviceSupport")}
                  surface="refund-aside"
                  variant="outline-light"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  {t("shared.serviceSupport")}
                </MarketingCtaLink>
              </div>
            </aside>

            <div className="space-y-4">
              {sections.map((section) => (
                <article
                  key={section.title}
                  data-legal-reveal
                  className={`${
                    section.tone === "soft"
                      ? "scheme-panel-soft scheme-border rounded-2xl border"
                      : "scheme-panel scheme-border rounded-2xl border"
                  } p-6 sm:p-7 md:p-8`}
                >
                  <h2 className="typ-card text-strong">{section.title}</h2>
                  {section.items.length > 0 ? (
                    <ul className="page-copy-sm text-body mt-4 list-disc space-y-3 pl-5">
                      {section.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {section.contactLines ? (
                    <div className="page-copy-sm text-body mt-4 space-y-2">
                      {section.contactLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </LegalBodyReveal>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={t("refund.ctaKicker")}
            title={
              <>
                {t("refund.ctaTitleLead")}{" "}
                <span className="text-accent-italic-on-dark">{t("refund.ctaTitleAccent")}</span>
              </>
            }
            description={t("refund.ctaDescription")}
            actions={[
              { href: "/contact", label: t("refund.ctaPrimary"), variant: "primary" },
              { href: "/terms", label: t("refund.ctaSecondary"), variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>

      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
