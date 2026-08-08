"use client";

import Link from "next/link";
import { ArrowRight, LockKey, Sparkle, UserCircle } from "@phosphor-icons/react";

import { OpenAssistantButton } from "@/features/shared/entry/OpenAssistantButton";

interface AccessPageProps {
  loginHref: string;
  guestHref: string;
}

export function AccessPage({ loginHref, guestHref }: AccessPageProps) {
  return (
    <section className="scheme-page relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, var(--color-white-50) 0%, color-mix(in srgb, var(--color-ocean-boat-blue-50) 22%, var(--color-white-100)) 55%, color-mix(in srgb, var(--color-ocean-boat-blue-50) 28%, var(--color-white-150)) 100%), radial-gradient(circle at top left, color-mix(in srgb, var(--color-bronze-400) 14%, transparent), transparent 24%), radial-gradient(circle at right, color-mix(in srgb, var(--color-ocean-boat-blue-600) 8%, transparent), transparent 24%)",
        }}
      />
      <div className="shell-container-wide relative px-6 pb-18 pt-24 2xl:px-0 md:pb-22 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="max-w-3xl">
            <p className="typ-label text-[color:var(--color-bronze-500)]">
              One suite, two paths
            </p>
            <h1 className="mt-6 typ-display max-w-4xl text-[color:var(--text-heading)] sm:text-6xl">
              Enter the workspace with intent.
            </h1>
            <p className="page-copy mt-6 max-w-2xl text-[color:var(--text-muted)]">
              Choose the authenticated member flow or continue as a guest. Both
              paths lead into the same suite chooser before you enter Planner
              or Configurator.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <OpenAssistantButton
                label="Ask AI which path fits"
                className="btn-outline inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold"
              />
              <span className="inline-flex items-center gap-2 rounded-full border border-theme-soft bg-[color:var(--surface-panel-strong)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">
                <Sparkle
                  size={14}
                  weight="fill"
                  className="text-[color:var(--color-bronze-500)]"
                />
                Planner and Configurator stay equal at the front door
              </span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Member continuity",
                  body: "Login unlocks Planner, Configurator, dashboard return paths, and downstream member review surfaces.",
                },
                {
                  title: "Honest guest mode",
                  body: "Guest mode keeps the real tools visible while save, import, export, share, and publish stay restricted in place.",
                },
              ].map((item) => (
                <div key={item.title} className="shell-card p-6">
                  <p className="typ-label text-subtle">{item.title}</p>
                  <p className="page-copy-sm mt-4 text-body">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="shell-card relative overflow-hidden p-6 sm:p-8">
            <div className="shell-top-accent" aria-hidden="true" />
            <p className="typ-label text-subtle">Choose access mode</p>
            <div className="mt-6 space-y-4">
              <Link
                href={loginHref}
                className="group block rounded-[1.6rem] border border-[color:var(--border-accent)] bg-[linear-gradient(180deg,var(--surface-page)_0%,var(--surface-soft)_100%)] px-6 py-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-accent-wash)] text-[color:var(--color-primary)]">
                      <UserCircle size={22} weight="duotone" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-primary)]">
                      Login
                    </p>
                    <h2 className="mt-3 text-2xl font-light tracking-tight text-[color:var(--text-heading)]">
                      Member access
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">
                      Open the authenticated route, keep recent work available,
                      and continue into member review surfaces after the chooser.
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--surface-accent-wash)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-primary)]">
                    Recommended
                  </span>
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-primary)]">
                  Continue with member login
                  <ArrowRight size={16} weight="bold" />
                </span>
              </Link>

              <Link
                href={guestHref}
                className="group block rounded-[1.6rem] border border-theme-soft bg-[color:var(--surface-page)] px-6 py-6 transition-transform hover:-translate-y-0.5"
              >
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-[color:var(--color-bronze-500)]">
                  <LockKey size={22} weight="duotone" />
                </div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--color-bronze-500)]">
                  Guest
                </p>
                <h2 className="mt-3 text-2xl font-light tracking-tight text-[color:var(--text-heading)]">
                  Guided exploration
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--text-muted)]">
                  Browse the same product chooser, then enter restricted live
                  tool surfaces with disabled output and persistence actions
                  explained in place.
                </p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)] transition group-hover:text-[color:var(--color-bronze-500)]">
                  Continue as guest
                  <ArrowRight size={16} weight="bold" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
