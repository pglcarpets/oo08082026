"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { AdminField, AdminSelect, AdminTextInput } from "../ui/AdminFormFields";

export type InventoryRow = {
  kind: string;
  urlRoute: string;
  area: string;
  renderMode: string;
  auth: string;
  file: string;
  summary: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {inQ = false;}
      else {cur += c;}
    } else if (c === '"') {inQ = true;}
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {cur += c;}
  }
  out.push(cur);
  return out;
}

function parseInventoryCsv(csv: string): InventoryRow[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {return [];}

  const headers = parseCsvLine(lines[0]);
  const index = (name: string) => headers.indexOf(name);
  const kindIdx = index("kind");
  const routeIdx = index("url_route");
  const areaIdx = index("area");
  const renderIdx = index("render_mode");
  const authIdx = index("auth");
  const fileIdx = index("file");
  const summaryIdx = index("summary") >= 0 ? index("summary") : index("how_it_works");

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      kind: cols[kindIdx] ?? "",
      urlRoute: cols[routeIdx] ?? "",
      area: cols[areaIdx] ?? "",
      renderMode: cols[renderIdx] ?? "",
      auth: cols[authIdx] ?? "",
      file: cols[fileIdx] ?? "",
      summary: cols[summaryIdx] ?? "",
    };
  });
}

type Props = {
  csv: string;
  generatedAt: string | null;
  rowCount: number;
};

export default function AdminInventoryPageView({ csv, generatedAt, rowCount }: Props) {
  const rows = useMemo(() => parseInventoryCsv(csv), [csv]);
  const [kindFilter, setKindFilter] = useState<"all" | string>("all");
  const [areaFilter, setAreaFilter] = useState<"all" | string>("all");
  const [query, setQuery] = useState("");

  const kinds = useMemo(() => [...new Set(rows.map((row) => row.kind).filter(Boolean))].sort(), [rows]);
  const areas = useMemo(() => [...new Set(rows.map((row) => row.area).filter(Boolean))].sort(), [rows]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (kindFilter !== "all" && row.kind !== kindFilter) {return false;}
      if (areaFilter !== "all" && row.area !== areaFilter) {return false;}
      if (!needle) {return true;}
      return [row.urlRoute, row.file, row.summary, row.auth]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [rows, kindFilter, areaFilter, query]);

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">Route inventory</p>
          <h1 className="admin-page__title">App pages &amp; APIs</h1>
          <p className="admin-page__copy">
            Route and API map for operators — not the product catalog or SVG
            symbol inventory. Live view of{" "}
            <code className="admin-type-code">results/app-pages-inventory.csv</code> —
            regenerate with{" "}
            <code className="admin-type-code">node scripts/generate-app-inventory-csv.mjs</code>.
          </p>
          <p className="admin-page__meta">
            {rowCount} rows
            {generatedAt ? ` · file updated ${new Date(generatedAt).toLocaleString("en-IN")}` : ""}
          </p>
        </div>
      </header>

      <div className="admin-toolbar">
        <AdminField label="Search">
          <AdminTextInput
            type="search"
            placeholder="Search route, file, summary…"
            className="min-w-0 sm:min-w-[16rem]"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={rows.length === 0}
          />
        </AdminField>
        <AdminField label="Kind">
          <AdminSelect
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value)}
            disabled={rows.length === 0}
          >
            <option value="all">All kinds</option>
            {kinds.map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Area">
          <AdminSelect
            value={areaFilter}
            onChange={(event) => setAreaFilter(event.target.value)}
            disabled={rows.length === 0}
          >
            <option value="all">All areas</option>
            {areas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </AdminSelect>
        </AdminField>
      </div>

      {rows.length === 0 ? (
        <div className="admin-empty admin-panel" role="status">
          <h2 className="admin-empty__title">Inventory not generated</h2>
          <p className="admin-empty__copy">
            The live route map is empty until the generator writes{" "}
            <code className="admin-type-code">results/app-pages-inventory.csv</code>.
          </p>
          <p className="admin-empty__copy">
            From the repo root run:
          </p>
          <pre className="admin-empty__code">node scripts/generate-app-inventory-csv.mjs</pre>
          <div className="admin-empty__actions">
            <Button asChild variant="outline" size="sm">
              <a href="/admin/settings">Open settings</a>
            </Button>
            <Button asChild variant="primary" size="sm">
              <a href="/admin">Back to dashboard</a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="admin-panel">
          <div className="admin-panel__header">Showing {filtered.length} of {rows.length}</div>
          {filtered.length === 0 ? (
            <div className="admin-empty" role="status">No routes match the current filters.</div>
          ) : (
            <div className="admin-table-wrap" data-phone-layout="cards-priority">
              <table className="admin-table" data-phone-layout="cards-priority">
                <caption className="sr-only">Application routes and API inventory</caption>
                <thead>
                  <tr>
                    <th scope="col">Kind</th>
                    <th scope="col">Route</th>
                    <th scope="col">Area</th>
                    <th scope="col">Auth</th>
                    <th scope="col">File</th>
                    <th scope="col">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={`${row.kind}-${row.urlRoute}-${row.file}`}>
                      <td data-label="Kind" className="text-muted">{row.kind}</td>
                      <td data-label="Route" className="admin-type-code--strong">{row.urlRoute || "—"}</td>
                      <td data-label="Area" className="text-muted">{row.area}</td>
                      <td data-label="Auth" className="text-muted">{row.auth}</td>
                      <td data-label="File" className="admin-type-code admin-type-muted">{row.file}</td>
                      <td data-label="Summary" className="max-w-md text-muted">{row.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
