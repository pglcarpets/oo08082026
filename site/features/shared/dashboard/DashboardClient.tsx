"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { createAuthClient } from "@/platform/supabase/client";
import {
  gsapReducedMotion,
  GSAP_EASE_OUT,
  GSAP_REVEAL,
  GSAP_SCROLL_REVEAL,
  registerGsapPlugins,
} from "@/lib/helpers/gsapMotion";
import { WORKSPACE_HUB_SECTIONS, type WorkspaceHubItem } from "./workspaceHub";

registerGsapPlugins();

interface DashboardClientProps {
  userEmail: string;
  accessError?: string;
}

function readPlannerDraftCount(): number {
  if (typeof window === "undefined") {return 0;}

  try {
    const raw = window.localStorage.getItem("planner_project_index");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function HubCard({ item }: { item: WorkspaceHubItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-label={`${item.label}: ${item.description}`}
      data-dashboard-card
      className="workspace-hub-card workspace-hub-card--link group flex h-full min-h-[11rem] flex-col rounded-[1.35rem] border p-5 transition-[border-color,box-shadow,transform] duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="workspace-hub-card__icon inline-flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-xl"
          aria-hidden
        >
          <Icon size={18} />
        </span>
        <ArrowRight
          size={16}
          className="workspace-hub-card__arrow shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden
        />
      </div>
      <h3 className="workspace-hub-card__title mt-4 text-base font-semibold tracking-tight">
        {item.label}
      </h3>
      <p className="workspace-hub-card__desc mt-2 flex-1 text-sm leading-6">{item.description}</p>
      <span className="workspace-hub-card__cta mt-4 text-xs font-bold uppercase tracking-[0.1em]">
        Open
      </span>
    </Link>
  );
}

function accessErrorMessage(code: string | undefined): string | null {
  if (code === "unauthorized_admin_access") {
    return "Your account is signed in, but it does not have platform admin access. Ask an owner to grant the admin role in Supabase app_metadata.role = \"admin\", then sign in again.";
  }
  return null;
}

export function DashboardClient({ userEmail, accessError }: DashboardClientProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [plannerDraftCount] = useState(() => readPlannerDraftCount());
  const [isSigningOut, setIsSigningOut] = useState(false);

  useGSAP(
    () => {
      if (gsapReducedMotion() || !rootRef.current) {
        return;
      }

      const ctx = gsap.context(() => {
        const heroTargets = rootRef.current?.querySelectorAll("[data-dashboard-reveal]");
        if (heroTargets?.length) {
          gsap.from(heroTargets, {
            y: GSAP_REVEAL.y,
            opacity: GSAP_REVEAL.opacity,
            duration: GSAP_REVEAL.duration,
            stagger: GSAP_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
          });
        }

        const cards = rootRef.current?.querySelectorAll("[data-dashboard-card]");
        if (cards?.length) {
          gsap.from(cards, {
            y: GSAP_SCROLL_REVEAL.y,
            opacity: GSAP_SCROLL_REVEAL.opacity,
            duration: GSAP_SCROLL_REVEAL.duration,
            stagger: GSAP_SCROLL_REVEAL.stagger,
            ease: GSAP_EASE_OUT,
            scrollTrigger: {
              trigger: cards[0],
              start: "top 88%",
              once: true,
            },
          });
        }
      }, rootRef);

      return () => ctx.revert();
    },
    { scope: rootRef },
  );

  const plannerSummary = useMemo(
    () =>
      plannerDraftCount > 0
        ? `${plannerDraftCount} saved local planner session${plannerDraftCount === 1 ? "" : "s"} ready to resume.`
        : "No saved local planner sessions yet — open the canvas to start an office furniture layout.",
    [plannerDraftCount],
  );

  const destinationCount = useMemo(
    () => WORKSPACE_HUB_SECTIONS.reduce((total, section) => total + section.items.length, 0),
    [],
  );

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      const supabase = createAuthClient();
      await supabase.auth.signOut();
      document.cookie = `${PLANNER_GUEST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax`;
      router.replace("/access");
      router.refresh();
    } catch {
      setIsSigningOut(false);
    }
  }

  const accessMessage = accessErrorMessage(accessError);

  return (
    <div ref={rootRef} className="flex w-full flex-col">
        {accessMessage ? (
          <div
            data-dashboard-reveal
            className="rounded-2xl border border-accent/30 bg-warning/10 px-5 py-4 text-sm leading-6 text-strong"
            role="alert"
          >
            {accessMessage}
          </div>
        ) : null}

        {/* region, not <header> — suite banner lives in dashboard layout shell */}
        <div
          className="workspace-hub__hero workspace-hub__hero--media rounded-[2rem] border p-5 sm:p-8 lg:p-10"
          role="region"
          aria-labelledby="dashboard-heading"
        >
          <div className="workspace-hub__hero-ambient" aria-hidden="true" />
          <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div
                data-dashboard-reveal
                className="workspace-hub__bronze-mark mb-4 w-14"
                aria-hidden="true"
              />
              <p
                data-dashboard-reveal
                className="workspace-hub__eyebrow text-[0.6875rem] font-semibold uppercase tracking-[0.3em]"
              >
                Member workspace
              </p>
              <p
                data-dashboard-reveal
                className="workspace-hub__eyebrow workspace-hub__eyebrow--status mt-2 text-xs font-medium"
              >
                {plannerDraftCount > 0 ? "Recent work available" : "Ready for first draft"}
              </p>
              <h1
                id="dashboard-heading"
                data-dashboard-reveal
                className="workspace-hub__title mt-4"
              >
                Your office furniture planner hub
              </h1>
              <p data-dashboard-reveal className="workspace-hub__lead mt-4 text-sm leading-7 sm:text-base">
                Signed in as {userEmail}. {plannerSummary}
              </p>
              <p data-dashboard-reveal className="workspace-hub__meta mt-3 text-xs">
                {destinationCount} destinations · Patna, Ranchi, Bihar &amp; Jharkhand
              </p>
            </div>

            <div data-dashboard-reveal className="workspace-hub__actions">
              <div className="workspace-hub__actions-primary">
                <Link href="/ooplanner" className="workspace-hub__primary-btn">
                  Open canvas
                </Link>
                <Link href="/choose-product" className="workspace-hub__ghost-btn">
                  Planner entry
                </Link>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="workspace-hub__sign-out"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>

        {WORKSPACE_HUB_SECTIONS.map((section) => {
          const sectionId = `hub-${section.title.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase()}`;
          return (
            <section
              key={section.title}
              className="workspace-hub__section"
              aria-labelledby={sectionId}
            >
              <div className="workspace-hub__section-header">
                <h2 id={sectionId} className="workspace-hub__section-title">
                  {section.title}
                </h2>
                <p className="workspace-hub__section-copy text-sm">{section.summary}</p>
              </div>
              <div className="workspace-hub__grid grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {section.items.map((item) => (
                  <HubCard key={item.href} item={item} />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
