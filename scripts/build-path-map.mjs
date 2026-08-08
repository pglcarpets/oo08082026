import { promises as fs } from "node:fs";
import path from "node:path";

const CATALOG = path.resolve("site/public/assets/catalog");
const FAMILIES = ["seating","workstations","tables","storage","soft-seating","educational","collaborative"];
const map = {};

// old flat: /assets/catalog/oando-seating--breeze/x -> /assets/catalog/seating/oando-seating--breeze/x
// older: /images/catalog/oando-seating--breeze/x
for (const fam of FAMILIES) {
  const famDir = path.join(CATALOG, fam);
  let ents = [];
  try { ents = await fs.readdir(famDir, { withFileTypes: true }); } catch { continue; }
  for (const e of ents) {
    if (!e.isDirectory() || e.name.startsWith("_")) continue;
    const folder = e.name;
    const nested = `/assets/catalog/${fam}/${folder}`;
    map[`/assets/catalog/${folder}`] = nested;
    map[`/images/catalog/${folder}`] = nested;
  }
}
// marketing backgrounds
map["/assets/marketing/auth_background.png"] = "/assets/marketing/backgrounds/auth_background.png";
map["/assets/marketing/hero_background.png"] = "/assets/marketing/backgrounds/hero_background.png";
map["/images/hero"] = "/assets/marketing/hero";
map["/images/client-logos"] = "/assets/marketing/client-logos";
map["/images/projects"] = "/assets/marketing/projects";
map["/images/fallback"] = "/assets/marketing/fallback";

await fs.writeFile("results/asset-cutover/path-map.json", JSON.stringify(map, null, 2));
console.log("path-map entries", Object.keys(map).length);
