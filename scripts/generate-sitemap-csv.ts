import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildSitemapCsv } from "../site/features/site/data/htmlSitemap";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(repoRoot, "docs", "architecture", "sitemap-routes.csv");

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, buildSitemapCsv(), "utf8");

console.log(`Wrote ${outputPath}`);
