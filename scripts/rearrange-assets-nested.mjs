/**
 * Proper nested rearrange of site/public/assets.
 * Does NOT upload to R2.
 *
 * Target:
 *   assets/marketing/{hero,client-logos,projects,home,brand,fallback,montage,partners,team,backgrounds,media}
 *   assets/catalog/{seating,workstations,tables,storage,soft-seating,educational,collaborative,products,flagship,_inbox}
 *   assets/planner/media
 *   assets/studio
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("site/public/assets");
const CATALOG = path.join(ROOT, "catalog");
const MARKETING = path.join(ROOT, "marketing");
const log = [];

function familyFromOandoDir(name) {
  // oando-seating--breeze -> seating
  const m = name.match(/^oando-([a-z0-9-]+)--/i);
  if (!m) return null;
  const fam = m[1].toLowerCase();
  // normalize
  if (fam === "soft-seating") return "soft-seating";
  return fam;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function movePath(from, to) {
  await ensureDir(path.dirname(to));
  // if dest exists, merge files into dest
  try {
    await fs.rename(from, to);
    log.push({ op: "rename", from, to });
    return;
  } catch (e) {
    if (e.code !== "EEXIST" && e.code !== "EPERM") {
      // cross-device or dest exists — copy merge
    }
  }
  const st = await fs.stat(from);
  if (st.isDirectory()) {
    await ensureDir(to);
    const ents = await fs.readdir(from, { withFileTypes: true });
    for (const ent of ents) {
      await movePath(path.join(from, ent.name), path.join(to, ent.name));
    }
    try {
      await fs.rmdir(from);
    } catch {
      /* non-empty leftovers */
    }
    log.push({ op: "merge-dir", from, to });
  } else {
    await ensureDir(path.dirname(to));
    try {
      await fs.rename(from, to);
    } catch {
      await fs.copyFile(from, to);
      await fs.unlink(from);
    }
    log.push({ op: "move-file", from, to });
  }
}

async function isEmptyDir(p) {
  try {
    const ents = await fs.readdir(p);
    return ents.length === 0;
  } catch {
    return true;
  }
}

async function main() {
  // --- Catalog: nest oando-* by family ---
  const catalogEnts = await fs.readdir(CATALOG, { withFileTypes: true });
  const families = new Set([
    "seating",
    "workstations",
    "tables",
    "storage",
    "soft-seating",
    "educational",
    "collaborative",
  ]);
  for (const fam of families) {
    await ensureDir(path.join(CATALOG, fam));
  }
  await ensureDir(path.join(CATALOG, "products"));
  await ensureDir(path.join(CATALOG, "flagship"));
  await ensureDir(path.join(CATALOG, "_inbox"));

  for (const ent of catalogEnts) {
    const name = ent.name;
    if (name === ".gitkeep" || name === "flagship" || name === "products" || name === "_inbox" || name === "legacy-categories") {
      continue;
    }
    if (families.has(name)) continue;

    const from = path.join(CATALOG, name);
    if (ent.isDirectory()) {
      const fam = familyFromOandoDir(name);
      if (fam && families.has(fam)) {
        const to = path.join(CATALOG, fam, name);
        await movePath(from, to);
        continue;
      }
      // fluid-x and other non-oando product dirs → seating if fluid, else _inbox
      if (/fluid/i.test(name)) {
        await movePath(from, path.join(CATALOG, "seating", name));
      } else {
        await movePath(from, path.join(CATALOG, "_inbox", name));
      }
    } else {
      // loose files at catalog root → _inbox
      await movePath(from, path.join(CATALOG, "_inbox", name));
    }
  }

  // legacy-categories → family folders under catalog (merge)
  const legacyRoot = path.join(CATALOG, "legacy-categories");
  try {
    const legs = await fs.readdir(legacyRoot, { withFileTypes: true });
    const map = {
      chairs: "seating",
      "soft-seating": "soft-seating",
      tables: "tables",
      workstations: "workstations",
      storage: "storage",
      educational: "educational",
      collaborative: "collaborative",
    };
    for (const ent of legs) {
      const fam = map[ent.name] || "_inbox";
      const from = path.join(legacyRoot, ent.name);
      const to = path.join(CATALOG, fam, `_legacy-${ent.name}`);
      await movePath(from, to);
    }
    if (await isEmptyDir(legacyRoot)) await fs.rmdir(legacyRoot);
    else await movePath(legacyRoot, path.join(CATALOG, "_inbox", "legacy-categories"));
  } catch {
    /* no legacy */
  }

  // --- Marketing: nest loose roots ---
  await ensureDir(path.join(MARKETING, "backgrounds"));
  await ensureDir(path.join(MARKETING, "docs"));
  for (const f of ["auth_background.png", "hero_background.png"]) {
    const from = path.join(MARKETING, f);
    try {
      await fs.access(from);
      await movePath(from, path.join(MARKETING, "backgrounds", f));
    } catch {
      /* skip */
    }
  }
  try {
    await fs.access(path.join(MARKETING, "CONTENTS.md"));
    await movePath(path.join(MARKETING, "CONTENTS.md"), path.join(MARKETING, "docs", "CONTENTS.md"));
  } catch {
    /* skip */
  }

  // marketing/media/hero → merge into marketing/hero if both exist
  const mediaHero = path.join(MARKETING, "media", "hero");
  const hero = path.join(MARKETING, "hero");
  try {
    await fs.access(mediaHero);
    const files = await fs.readdir(mediaHero);
    for (const f of files) {
      await movePath(path.join(mediaHero, f), path.join(hero, f));
    }
    try {
      await fs.rm(path.join(MARKETING, "media"), { recursive: true });
    } catch {
      /* keep if leftover */
    }
  } catch {
    /* no media/hero */
  }

  // home/client-logos is odd nesting — leave but note; optional flatten later

  // planner
  await ensureDir(path.join(ROOT, "planner", "media"));
  await ensureDir(path.join(ROOT, "studio"));

  // write structure snapshot
  async function tree(dir, depth = 0, maxDepth = 3, lines = []) {
    if (depth > maxDepth) return lines;
    let ents;
    try {
      ents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return lines;
    }
    ents.sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of ents) {
      const pad = "  ".repeat(depth);
      if (ent.isDirectory()) {
        lines.push(`${pad}${ent.name}/`);
        await tree(path.join(dir, ent.name), depth + 1, maxDepth, lines);
      } else if (depth <= 1) {
        lines.push(`${pad}${ent.name}`);
      }
    }
    return lines;
  }

  const structure = (await tree(ROOT, 0, 3)).join("\n");
  const outDir = path.resolve("results/asset-cutover");
  await ensureDir(outDir);
  await fs.writeFile(
    path.join(outDir, "rearrange-nested.md"),
    [
      "# Nested rearrange (proper)",
      "",
      "Catalog product folders nested under family:",
      "`seating/`, `workstations/`, `tables/`, `storage/`, `soft-seating/`, `educational/`, `collaborative/`",
      "",
      "Loose catalog root files → `catalog/_inbox/`",
      "Legacy category dumps → `catalog/<family>/_legacy-*`",
      "Marketing backgrounds → `marketing/backgrounds/`",
      "marketing/media/hero merged into `marketing/hero/`",
      "",
      "## Tree (depth 3)",
      "",
      "```",
      structure,
      "```",
      "",
      `Ops log entries: ${log.length}`,
      "",
    ].join("\n"),
  );
  await fs.writeFile(path.join(outDir, "rearrange-nested-log.json"), JSON.stringify({ count: log.length, log: log.slice(0, 5000) }, null, 2));
  console.log("DONE ops", log.length);
  console.log(structure.split("\n").slice(0, 80).join("\n"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
