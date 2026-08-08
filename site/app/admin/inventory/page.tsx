import fs from "node:fs";
import path from "node:path";

import AdminInventoryPageView from "@/features/admin/inventory/AdminInventoryPageView";

const SITE_ROOT = process.cwd();
const REPO_ROOT =
  path.basename(SITE_ROOT) === "site" ? path.resolve(SITE_ROOT, "..") : SITE_ROOT;
const INVENTORY_PATH = path.join(REPO_ROOT, "results", "app-pages-inventory.csv");

export default function AdminInventoryPage() {
  let csv = "";
  let generatedAt: string | null = null;
  let rowCount = 0;

  if (fs.existsSync(INVENTORY_PATH)) {
    csv = fs.readFileSync(INVENTORY_PATH, "utf8");
    generatedAt = fs.statSync(INVENTORY_PATH).mtime.toISOString();
    rowCount = Math.max(0, csv.split(/\r?\n/).filter(Boolean).length - 1);
  }

  return <AdminInventoryPageView csv={csv} generatedAt={generatedAt} rowCount={rowCount} />;
}
