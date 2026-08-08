"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function ConfiguratorCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Configurator catalog"
      description="Configurator SKU lane: parametric, discrete, and fixed products with size options and footprints. Prefer forms; advanced JSON only for workstation rules. Simple managed products → Standard catalog. Symbols → SVG symbols. Static bundled browse → Workspace library (read-only)."
      catalogType="configurator"
    />
  );
}
