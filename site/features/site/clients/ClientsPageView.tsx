import { ClientsCaseStudies } from "@/components/clients/ClientsCaseStudies";
import { ClientsHero } from "@/components/clients/ClientsHero";
import { ClientsProofStrip } from "@/components/clients/ClientsProofStrip";
import { HomeMarketingLayout, HomeSection, HomeSectionInner } from "@/components/home/layout";
import { KpiIntegrityMonitor } from "@/components/analytics/KpiIntegrityMonitor";
import { RouteCtaBand } from "@/components/shared/RouteCtaBand";
import { ContactTeaser } from "@/components/shared/ContactTeaser";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";
import { getBusinessStats } from "@/features/crm/businessStats";
import { buildClientWorkWithPhotos } from "@/features/site/data/clientWorkPhotos";
import { CLIENTS_PAGE_COPY, CLIENTS_WORK } from "@/features/site/data/routeCopy";
import { buildPageJsonLd } from "@/features/site/data/seo";
import { formatKpiAsOf, formatKpiValuePlus } from "@/lib/kpiFormat";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeJsonForScript } from "@/lib/security/sanitize";

const CLIENTS_JSON_LD = buildPageJsonLd(SITE_URL, {
  path: "/clients",
  title:
    "Trusted clients | Office furniture delivery Patna, Bihar & Jharkhand | One&Only",
  description: CLIENTS_PAGE_COPY.heroSubtitle,
  pageType: "CollectionPage",
});

/**
 * Hero â†’ editorial proof strip â†’ case studies â†’ bronze pull quotes â†’ CTA â†’ ContactTeaser.
 * Photography-forward proof â€” no client logo wall, no centered KPI grid.
 */
export async function ClientsPageView() {
  const [{ stats, source }, clientWork] = await Promise.all([
    getBusinessStats(),
    buildClientWorkWithPhotos(CLIENTS_WORK),
  ]);
  const clientsValue = formatKpiValuePlus(stats.clientOrganisations);
  const projectsValue = formatKpiValuePlus(stats.projectsDelivered);
  const sectorsValue = formatKpiValuePlus(stats.sectorsServed);
  const asOfLabel = formatKpiAsOf(stats.asOfDate);

  const proofItems = [
    { id: "client-organisations", value: clientsValue, label: "Client organisations" },
    { id: "projects-delivered", value: projectsValue, label: "Projects delivered" },
    { id: "sectors-served", value: sectorsValue, label: "Sectors served" },
  ] as const;

  return (
    <HomeMarketingLayout>
      <KpiIntegrityMonitor page="clients" source={source} stats={stats} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonForScript(CLIENTS_JSON_LD),
        }}
      />
      <ClientsHero
        kicker={CLIENTS_PAGE_COPY.eyebrow}
        titleLead={CLIENTS_PAGE_COPY.heroTitleLead}
        titleAccent={CLIENTS_PAGE_COPY.heroTitleAccent}
        subtitle={CLIENTS_PAGE_COPY.heroSubtitleTemplate.replace("{clients}", clientsValue)}
      />

      <ClientsProofStrip items={proofItems} asOfLabel={asOfLabel} />

      <HomeSection variant="white" spacing="sm">
        <HomeSectionInner>
          {clientWork.length === 0 ? (
            <div
              className="scheme-panel scheme-border rounded-2xl border px-6 py-10 text-center"
              role="status"
            >
              <h2 className="home-heading">{CLIENTS_PAGE_COPY.emptyTitle}</h2>
              <p className="page-copy text-body mx-auto mt-4 max-w-lg">
                {CLIENTS_PAGE_COPY.emptyDescription}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <MarketingCtaLink
                  href="/trusted-by"
                  label={CLIENTS_PAGE_COPY.trustedCta}
                  surface="clients-empty"
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                >
                  {CLIENTS_PAGE_COPY.trustedCta}
                </MarketingCtaLink>
                <MarketingCtaLink
                  href="/contact"
                  label={CLIENTS_PAGE_COPY.contactCta}
                  surface="clients-empty"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                >
                  {CLIENTS_PAGE_COPY.contactCta}
                </MarketingCtaLink>
              </div>
            </div>
          ) : (
            <ClientsCaseStudies clients={clientWork} />
          )}
        </HomeSectionInner>
      </HomeSection>

      <section
        className="clients-trust-strip about-craft-strip scheme-accent-wash"
        aria-label="Client delivery quotes"
      >
        <div className="home-shell-xl clients-pull-quotes">
          {CLIENTS_PAGE_COPY.pullQuotes.map((item) => (
            <figure key={item.attribution} className="clients-pull-quote about-craft-quote">
              <span className="about-craft-quote__rule" aria-hidden="true" />
              <blockquote className="about-craft-quote__text home-heading text-balance">
                {item.quote}
              </blockquote>
              <figcaption className="about-craft-quote__attribution">
                {item.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <HomeSection variant="white" spacing="sm" className="border-t-0">
        <HomeSectionInner>
          <RouteCtaBand
            kicker={CLIENTS_PAGE_COPY.ctaKicker}
            title={
              <>
                {CLIENTS_PAGE_COPY.ctaTitleLead}{" "}
                <span className="text-accent-italic-on-dark">
                  {CLIENTS_PAGE_COPY.ctaTitleAccent}
                </span>
              </>
            }
            description={CLIENTS_PAGE_COPY.ctaDescription}
            actions={[
              {
                href: "/planning",
                label: CLIENTS_PAGE_COPY.planningCta,
                variant: "primary",
              },
              {
                href: "/contact",
                label: CLIENTS_PAGE_COPY.contactCta,
                variant: "outline-light",
              },
            ]}
          />
        </HomeSectionInner>
      </HomeSection>

      <ContactTeaser />
    </HomeMarketingLayout>
  );
}
