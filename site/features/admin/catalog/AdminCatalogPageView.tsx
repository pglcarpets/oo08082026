"use client";

import { AdminCatalogListView } from "./AdminCatalogListView";

export default function AdminCatalogPageView() {
  return (
    <AdminCatalogListView
      title="Standard catalog"
      description="Day-to-day product list: edit managed planner products (name, dimensions, mesh, price, visibility). Not SVG authoring and not the static workspace library. Parametric SKUs → Configurator catalog. 2D symbols → SVG symbols. Static audit → Workspace library."
      catalogType="standard"
    />
  );
}
