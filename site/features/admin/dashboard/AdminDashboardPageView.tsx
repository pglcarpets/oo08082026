"use client";

import { useRef } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

import {
  GSAP_EASE_OUT,
  GSAP_SCROLL_REVEAL,
  gsapReducedMotion,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import { AdminAlert } from "../ui/AdminAlert";
import { AdminHubLinkCard } from "../ui/AdminHubLinkCard";
import { AdminKpiLink } from "../ui/AdminKpiLink";
import { ADMIN_HUB_KPIS, ADMIN_HUB_SECTIONS } from "../ui/adminNav";
import AdminEntryHero from "./AdminEntryHero";

registerGsapPlugins();

const CRM_HUB_SECTION_TITLE = "CRM & ops";
const HUB_CONTENT_ID = "admin-hub-content";

export default function AdminDashboardPageView() {
  const pageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !pageRef.current) {
        return;
      }

      const scroller = pageRef.current.closest<HTMLElement>(".shell-admin-main");

      const ctx = gsap.context(() => {
        const kpis = pageRef.current?.querySelectorAll<HTMLElement>(".admin-kpi-grid .admin-kpi");
        if (kpis?.length) {
          gsap.from(kpis, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: ".admin-kpi-grid",
              scroller: scroller ?? undefined,
              start: "top 92%",
              once: true,
            },
          });
        }

        const sections = pageRef.current?.querySelectorAll<HTMLElement>(".admin-hub-section");
        sections?.forEach((section) => {
          const cards = section.querySelectorAll<HTMLElement>(".shell-admin-card");
          if (!cards.length) {
            return;
          }
          gsap.from(cards, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: section,
              scroller: scroller ?? undefined,
              start: "top 90%",
              once: true,
            },
          });
        });
      }, pageRef);

      return () => ctx.revert();
    },
    { scope: pageRef },
  );

  return (
    <div ref={pageRef} className="admin-page shell-admin-dashboard">
      <AdminEntryHero hubTargetId={HUB_CONTENT_ID} />

      <div id={HUB_CONTENT_ID} tabIndex={-1}>
        <section className="admin-kpi-grid" aria-label="Quick operations">
          {ADMIN_HUB_KPIS.map((kpi) => (
            <AdminKpiLink
              key={kpi.href}
              href={kpi.href}
              label={kpi.label}
              hint={kpi.hint}
              tone={kpi.tone}
              cta={
                <>
                  Open
                  <ArrowRight size={14} aria-hidden />
                </>
              }
            />
          ))}
        </section>

        {ADMIN_HUB_SECTIONS.map((section) => {
          const showCrmStorageWarning = section.title === CRM_HUB_SECTION_TITLE;

          return (
            <section
              key={section.title}
              className="admin-hub-section"
              aria-labelledby={`hub-${section.title}`}
            >
              <h2 id={`hub-${section.title}`} className="admin-hub-section__title">
                {section.title}
              </h2>
              {showCrmStorageWarning ? (
                <AdminAlert variant="warn" role="status" title="Browser-only CRM storage.">
                  Clients, projects, and quotes save to this browser only. They do not sync, and
                  clearing site storage removes them.
                </AdminAlert>
              ) : null}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {section.items.map((card) => (
                  <AdminHubLinkCard
                    key={card.href}
                    href={card.href}
                    label={card.label}
                    description={card.description}
                    icon={card.icon}
                    external={card.external}
                    cta={
                      <>
                        {card.external ? "Open ↗" : "Open"}
                        <ArrowRight size={14} aria-hidden />
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
