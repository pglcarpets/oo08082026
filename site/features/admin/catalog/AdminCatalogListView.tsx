"use client";

import { AdminCatalogManager } from "./AdminCatalogManager";

type CatalogListProps = {
  title: string;
  description: string;
  catalogType: "standard" | "configurator";
};

/** Full catalog CRUD panel (list, filter, create, edit, visibility, delete). */
export function AdminCatalogListView(props: CatalogListProps) {
  return <AdminCatalogManager {...props} />;
}

export default AdminCatalogListView;
