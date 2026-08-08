"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { AdminField, AdminSelect, AdminTextInput } from "@/features/admin/ui/AdminFormFields";
import { AdminAlert } from "@/features/admin/ui/AdminAlert";
import plannerCanvasConfig from "@/platform/planner-canvas.json";
import { PLANNER_CATALOG_ITEMS } from "@/lib/catalog/workspaceCatalog";
import {
  formatCatalogDimensionsLabel,
  formatCatalogSeatFootprint,
  enrichCatalogItem,
} from "@/lib/catalog/catalogHierarchy";

export default function AdminWorkspaceCatalogPageView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const items = useMemo(() => {
    const enriched = PLANNER_CATALOG_ITEMS.map(enrichCatalogItem);
    const q = query.trim().toLowerCase();
    return enriched.filter((item) => {
      if (category && item.category !== category) {return false;}
      if (!q) {return true;}
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.sku ?? "").toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const categories = useMemo(
    () => [...new Set(PLANNER_CATALOG_ITEMS.map((item) => item.category))].sort(),
    [],
  );

  return (
    <div className="admin-page" data-testid="admin-workspace-catalog-page">
      <header className="admin-page__header" data-testid="admin-shell-header">
        <div>
          <p className="admin-page__eyebrow" data-testid="admin-shell-scope">
            Catalog · static · read-only
          </p>
          <h1 className="admin-page__title" data-testid="admin-shell-title">
            Read-only workspace element library
          </h1>
          <p className="admin-page__copy" data-testid="admin-workspace-catalog-copy">
            This is the <strong>read-only workspace element library</strong> — browse
            and audit the bundled static planner layer (
            <code>workspaceCatalog</code>). You cannot create, edit, or delete items
            here. Editable products live in{" "}
            <Link href="/admin/catalog" className="text-primary underline underline-offset-2">
              Standard catalog
            </Link>{" "}
            and{" "}
            <Link
              href="/admin/planner-catalog"
              className="text-primary underline underline-offset-2"
            >
              Configurator catalog
            </Link>
            . Live planner hydration also merges those editable sources. Regenerate
            static items from CSV via{" "}
            <code className="rounded bg-subtle px-1">
              npx tsx scripts/ingest-planner-catalog.ts
            </code>
            .
          </p>
          <p className="admin-page__meta" data-testid="admin-shell-source">
            Source: static bundle · not Products DB · not editable
          </p>
          <p
            className="admin-page__meta"
            role="status"
            data-testid="admin-shell-state"
          >
            State: <strong>{items.length}</strong> shown
            {query || category ? " (filtered)" : ""} · read-only
          </p>
        </div>
      </header>

      <AdminAlert
        variant="info"
        role="status"
        data-testid="admin-workspace-readonly-banner"
        title="Read-only workspace element library"
      >
        Browse only. Do not confuse this with Standard or Configurator catalogs —
        those are the editable product lanes.
      </AdminAlert>

      <div className="admin-toolbar" role="search" aria-label="Filter workspace library">
        <AdminField label="Search" className="admin-field--search min-w-0 flex-1">
          <div className="relative min-w-[12.5rem]">
            <Search size={14} className="admin-field__search-icon" aria-hidden />
            <AdminTextInput
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              placeholder="SKU, name, id…"
              data-testid="admin-workspace-search"
              autoComplete="off"
            />
          </div>
        </AdminField>
        <AdminField label="Category">
          <AdminSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-w-[8.75rem]"
            data-testid="admin-workspace-category"
            aria-label="Filter by category"
          >
            <option value="">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
      </div>

      {items.length === 0 ? (
        <div
          className="admin-empty"
          role="status"
          data-testid="admin-workspace-empty"
        >
          <p className="admin-empty__title">
            {PLANNER_CATALOG_ITEMS.length === 0
              ? "Workspace element library is empty"
              : "No workspace items match these filters"}
          </p>
          <p className="admin-empty__copy">
            {PLANNER_CATALOG_ITEMS.length === 0
              ? "This read-only library is fed by the static bundle. Regenerate from CSV with the ingest script, or open Standard / Configurator catalog for editable products."
              : "Change the search or category, or clear filters. This library stays read-only."}
          </p>
          <div className="admin-empty__actions">
            {query || category ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
                data-testid="admin-workspace-clear-filters"
              >
                Clear filters
              </Button>
            ) : null}
            <Button asChild variant="primary" size="sm">
              <Link
                href="/admin/catalog"
                data-testid="admin-workspace-goto-standard"
              >
                Open Standard catalog
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="admin-panel admin-workspace-inventory"
          data-testid="admin-workspace-inventory"
        >
          <div className="admin-panel__header">
            Read-only workspace element library · {items.length} of{" "}
            {PLANNER_CATALOG_ITEMS.length}
          </div>
          <ul
            className="admin-workspace-card-list md:hidden"
            aria-label="Workspace catalog items"
            data-testid="admin-workspace-cards"
          >
            {items.map((item) => (
              <li key={item.id} className="admin-workspace-card">
                <div className="admin-workspace-card__head">
                  <div className="min-w-0">
                    <p className="admin-table__primary">
                      {item.shortName ?? item.name}
                    </p>
                    <p className="admin-table__secondary break-all font-mono">
                      {item.sku ?? item.id}
                    </p>
                  </div>
                  <span className="admin-badge admin-badge--hidden shrink-0">
                    {item.category}
                  </span>
                </div>
                <dl className="admin-workspace-card__meta">
                  <div>
                    <dt>Seats</dt>
                    <dd>{item.seatCount ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Footprint</dt>
                    <dd>{formatCatalogSeatFootprint(item)}</dd>
                  </div>
                  <div className="admin-workspace-card__meta-full">
                    <dt>Dimensions</dt>
                    <dd>{formatCatalogDimensionsLabel(item)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div
            className="admin-table-wrap hidden md:block"
            data-phone-layout="cards-priority"
          >
            <table
              className="admin-table"
              data-testid="admin-workspace-table"
            >
              <caption className="sr-only">
                Read-only workspace element library items
              </caption>
              <thead>
                <tr>
                  <th scope="col">SKU / ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">Seats</th>
                  <th scope="col">Footprint</th>
                  <th scope="col">Raw fields</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="SKU / ID">
                      <code className="admin-table__secondary">
                        {item.sku ?? item.id}
                      </code>
                    </td>
                    <td data-label="Name">
                      <span className="admin-table__primary">
                        {item.shortName ?? item.name}
                      </span>
                    </td>
                    <td data-label="Category">{item.category}</td>
                    <td data-label="Seats">{item.seatCount ?? "—"}</td>
                    <td data-label="Footprint">
                      <p>{formatCatalogSeatFootprint(item)}</p>
                      <p className="admin-table__secondary">
                        {formatCatalogDimensionsLabel(item)}
                      </p>
                    </td>
                    <td data-label="Raw">
                      <span className="admin-table__secondary font-mono">
                        w:{item.widthMm} d:{item.depthMm} h:{item.heightMm}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminCanvasConfigSection() {
  const config = plannerCanvasConfig;
  const rows: Array<{ group: string; key: string; value: string }> = [];

  for (const [group, values] of Object.entries(config)) {
    if (values && typeof values === "object") {
      for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
        rows.push({ group, key, value: String(value) });
      }
    }
  }

  return (
    <section className="rounded-xl border border-soft bg-panel">
      <header className="border-b border-soft px-4 py-3">
        <h2 className="admin-type-section">Canvas configuration</h2>
        <p className="mt-1 text-xs text-muted">
          From <code>platform/planner-canvas.json</code> — edit in repo and redeploy to change bounds, scale, and viewport.
        </p>
      </header>
      <div className="admin-table-wrap" role="region" aria-label="Canvas configuration table">
      <table className="admin-table min-w-[28rem]">
        <caption className="sr-only">Planner canvas configuration values</caption>
        <thead className="border-b border-soft text-xs uppercase text-soft">
          <tr>
            <th scope="col">Group</th>
            <th scope="col">Parameter</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.group}.${row.key}`} className="border-b border-soft last:border-b-0">
              <td className="px-4 py-2 text-muted">{row.group}</td>
              <td className="px-4 py-2 font-mono text-xs">{row.key}</td>
              <td className="px-4 py-2 font-medium text-strong">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </section>
  );
}
