"use client";

import Link from "next/link";
import { ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";

import { getAllFlagsGrouped, DEFAULT_FLAGS, type FeatureFlagName } from "@/lib/featureFlags";
import { AdminCanvasConfigSection } from "../workspace-catalog/AdminWorkspaceCatalogPageView";

const ENV_HINTS = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", purpose: "Supabase project URL for cloud saves and catalog" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", purpose: "Server-side catalog CRUD (admin API)" },
  { key: "OPENROUTER_API_KEY_PRIMARY / GEMINI_API_KEY", purpose: "Mastra AI advisor (OpenRouter or Gemini)" },
  { key: "SUPABASE_AUTH_DATABASE_URL", purpose: "Admin Postgres (planner saves, migrations)" },
] as const;

export default function AdminSettingsPageView() {
  const grouped = getAllFlagsGrouped();

  return (
    <div className="admin-page admin-page--loose">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Platform parameters</p>
          <h1 className="admin-page__title">Settings & configuration</h1>
          <p className="admin-page__copy">
            Reference for planner canvas limits, feature-flag defaults, environment variables, and catalog data sources.
            Toggle live flags on the{" "}
            <Link href="/admin/features" className="admin-link">
              Features
            </Link>{" "}
            page.
          </p>
        </div>
      </header>

      <AdminCanvasConfigSection />

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2 className="admin-type-section">Feature flag defaults</h2>
          <p className="admin-panel__intro">
            Shipped defaults from code. Runtime overrides may come from Supabase or local storage.
          </p>
        </header>
        <div className="admin-list-divide">
          {grouped.map((group) => (
            <div key={group.group} className="admin-list-block">
              <h3 className="admin-type-label">{group.group}</h3>
              <ul className="admin-stack--tight">
                {group.flags.map((flag) => (
                  <li key={flag.name} className="admin-list-row">
                    <span className="admin-list-row__main">
                      <code className="admin-type-code">{flag.name}</code>
                      <span className="admin-type-muted"> {flag.description}</span>
                    </span>
                    <span
                      className={`admin-badge admin-icon-static ${DEFAULT_FLAGS[flag.name as FeatureFlagName] ? "admin-type-body--strong" : "admin-badge--hidden"}`}
                    >
                      {DEFAULT_FLAGS[flag.name as FeatureFlagName] ? "on" : "off"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="admin-panel">
        <header className="admin-panel__header">
          <h2 className="admin-type-section">Environment variables</h2>
          <p className="admin-panel__intro">
            Set in Render dashboard or local <code className="admin-type-code">.env.local</code>.
          </p>
        </header>
        <ul className="admin-list-divide">
          {ENV_HINTS.map((hint) => (
            <li key={hint.key} className="admin-list-block admin-type-body">
              <code className="admin-type-code--strong">{hint.key}</code>
              <p className="admin-type-meta">{hint.purpose}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-panel admin-panel--padded">
        <h2 className="admin-type-section">Catalog data paths</h2>
        <ul className="admin-panel__body-list">
          <li>
            <Link href="/admin/workspace-catalog" className="admin-link">
              Workspace library
            </Link>{" "}
            — read-only static ingest (<code className="admin-type-code">lib/catalog/workspaceCatalog</code>)
          </li>
          <li>
            <Link href="/admin/catalog" className="admin-link">
              Standard catalog
            </Link>{" "}
            — editable managed products in <code className="admin-type-code">planner_managed_products</code>
          </li>
          <li>
            <Link href="/admin/planner-catalog" className="admin-link">
              Configurator catalog
            </Link>{" "}
            — editable <code className="admin-type-code">configurator_products</code> payloads for parametric, discrete, and fixed SKUs
          </li>
          <li>
            Guest planner library — static + configurator + managed (hydrated at runtime)
          </li>
          <li>
            <Link href="/admin/inventory" className="admin-link-row">
              Route inventory <ExternalLink size={12} className="admin-icon-static" />
            </Link>{" "}
            — app routes and API map (not product stock)
          </li>
        </ul>
      </section>
    </div>
  );
}
