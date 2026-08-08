import { getTranslations } from "next-intl/server";
import { LegalBodyReveal } from "@/components/legal/LegalBodyReveal";
import { LegalRouteHero } from "@/components/legal/LegalRouteHero";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { SITE_CONTACT } from "@/features/site/data/contact";
import { PRIVACY_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = PRIVACY_PAGE_METADATA;

const COOKIE_ROWS = [
  {
    name: "oando_cookie_consent",
    category: "Essential",
    purpose: "Stores your cookie preference so we do not ask on every visit.",
    duration: "180 days",
  },
  {
    name: "oando_seo_landing",
    category: "Analytics & attribution",
    purpose: "Stores the landing page path for attribution reporting.",
    duration: "180 days",
  },
  {
    name: "oando_seo_referrer",
    category: "Analytics & attribution",
    purpose: "Stores the referring URL or source site.",
    duration: "180 days",
  },
  {
    name: "oando_seo_source",
    category: "Analytics & attribution",
    purpose: "Stores the traffic source such as direct, Google, or LinkedIn.",
    duration: "180 days",
  },
  {
    name: "oando_seo_medium",
    category: "Analytics & attribution",
    purpose: "Stores the traffic medium such as referral, none, or campaign medium.",
    duration: "180 days",
  },
  {
    name: "oando_seo_campaign",
    category: "Analytics & attribution",
    purpose: "Stores the UTM campaign value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_term",
    category: "Analytics & attribution",
    purpose: "Stores the UTM term value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_content",
    category: "Analytics & attribution",
    purpose: "Stores the UTM content value when present.",
    duration: "180 days",
  },
  {
    name: "oando_seo_locale",
    category: "Analytics & attribution",
    purpose: "Stores the current site locale for attribution context.",
    duration: "180 days",
  },
] as const;

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const intro = t.raw("privacy.intro") as string[];
  const commitments = t.raw("privacy.commitments") as string[];

  return (
    <HomeMarketingLayout>
      <LegalRouteHero
        title={t("privacy.title")}
        subtitle={t("privacy.heroSubtitle")}
        testId="privacy-hero"
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
              <p className="typ-label text-inverse-muted">
                {t("privacy.overviewKicker")}
              </p>
              <h2 className="home-heading legal-aside__title mt-3 text-inverse">
                {t("privacy.overviewTitle")}
              </h2>
              <p className="page-copy text-inverse-body mt-4">
                {t("privacy.overviewDescription")}
              </p>

              <div className="legal-aside-divider">
                <h3 className="typ-label text-inverse-muted">
                  {t("privacy.commitmentsTitle")}
                </h3>
                <ul className="text-inverse-body mt-4 space-y-3 text-sm leading-7">
                  {commitments.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
                <MarketingCtaLink
                  href="/contact"
                  label="Contact team"
                  surface="privacy-aside"
                  variant="primary"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  Contact team
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/downloads"
                  label="Open Resource Desk"
                  surface="privacy-aside"
                  variant="outline-light"
                  context="hero"
                  className="w-full justify-center sm:w-auto"
                >
                  Open Resource Desk
                </MarketingCtaLink>
              </div>
            </aside>

            <div
              data-legal-reveal
              className="scheme-panel scheme-border rounded-2xl border p-6 sm:p-7 md:p-9"
            >
              <div className="space-y-5 sm:space-y-6">
                {intro.map((paragraph) => (
                  <p key={paragraph} className="page-copy text-body">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="scheme-border mt-8 grid gap-6 border-t pt-8 sm:mt-10 sm:gap-8 sm:pt-10 md:grid-cols-2">
                <article className="space-y-3 sm:space-y-4">
                  <h2 className="typ-card text-strong">How we use your information</h2>
                  <p className="page-copy-sm text-body">
                    We use submitted information to respond to quote requests, follow up
                    on workspace enquiries, improve service quality, and maintain internal
                    records of sales and support conversations.
                  </p>
                  <p className="page-copy-sm text-body">
                    We do not sell your personal information. We may disclose information
                    when required by law, to investigate misuse, or to maintain and secure
                    our services.
                  </p>
                </article>

                <article className="space-y-3 sm:space-y-4">
                  <h2 className="typ-card text-strong">Links and security</h2>
                  <p className="page-copy-sm text-body">
                    Our website may link to external websites. Their privacy practices are
                    separate from ours, so you should review their policies before sharing
                    information there.
                  </p>
                  <p className="page-copy-sm text-body">
                    We use reasonable technical and organisational measures to protect the
                    information we collect. No system can guarantee absolute security, but
                    we take steps to reduce risk and restrict unnecessary access.
                  </p>
                </article>
              </div>

              <div className="scheme-panel-soft scheme-border mt-8 overflow-hidden rounded-2xl border sm:mt-10">
                <div className="px-5 py-5 sm:px-6 sm:py-6 md:px-8">
                  <h2 className="typ-card text-strong">
                    Cookies, tags, and similar technologies
                  </h2>
                  <p className="page-copy-sm text-body mt-3">
                    We use one essential cookie to remember your consent choice and optional
                    analytics and attribution cookies to record landing page, referrer, and
                    UTM parameters when you accept them in the cookie banner.
                  </p>
                </div>

                {/* Mobile: card stack · Desktop: table */}
                <ul className="legal-cookie-cards md:hidden" aria-label="Cookies used on this site">
                  {COOKIE_ROWS.map((row) => (
                    <li key={row.name} className="legal-cookie-card">
                      <p className="legal-cookie-card__name">{row.name}</p>
                      <p className="legal-cookie-card__meta">
                        <span>{row.category}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{row.duration}</span>
                      </p>
                      <p className="legal-cookie-card__purpose">{row.purpose}</p>
                    </li>
                  ))}
                </ul>

                <div className="legal-cookie-table-scroll hidden md:block">
                  <table className="legal-cookie-table">
                    <thead>
                      <tr>
                        <th scope="col">Cookie</th>
                        <th scope="col">Category</th>
                        <th scope="col">Purpose</th>
                        <th scope="col">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {COOKIE_ROWS.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.category}</td>
                          <td>{row.purpose}</td>
                          <td>{row.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="scheme-border mt-8 flex flex-col gap-4 border-t pt-8 sm:mt-10 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <h2 className="typ-card text-strong">Questions about privacy?</h2>
                  <p className="page-copy-sm text-body mt-2">
                    For privacy questions or requests, email{" "}
                    <a
                      href={`mailto:${SITE_CONTACT.salesEmail}`}
                      className="font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                      {SITE_CONTACT.salesEmail}
                    </a>
                    . The latest version of this policy will always be published on this
                    page.
                  </p>
                </div>
                <MarketingCtaLink
                  href="/contact"
                  label="Contact support"
                  surface="privacy-body"
                  variant="outline"
                  className="w-full shrink-0 justify-center md:w-auto"
                >
                  Contact support
                </MarketingCtaLink>
              </div>
            </div>
          </LegalBodyReveal>
        </HomeSectionInner>
      </HomeSection>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker="Privacy desk"
            title={
              <>
                Need a workspace enquiry handled{" "}
                <span className="text-accent-italic-on-dark">with care</span>
              </>
            }
            description="Ask about data handling, attribution cookies, or how we store project communication — our team will respond through official channels."
            actions={[
              { href: "/contact", label: "Contact team", variant: "primary" },
              { href: "/terms", label: "View terms", variant: "outline-light" },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>

      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
