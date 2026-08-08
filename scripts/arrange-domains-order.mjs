/**
 * Arrange domains in order: marketing → planner → studio → catalog
 * Multi-level subfolders. No R2. Prefer move over delete.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve("site/public/assets");
const log = [];

async function ensure(p) {
  await fs.mkdir(p, { recursive: true });
}
async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
async function move(from, to) {
  if (!(await exists(from))) return;
  await ensure(path.dirname(to));
  if (await exists(to)) {
    // keep both: prefix
    const alt = path.join(path.dirname(to), `dup-${path.basename(to)}`);
    await fs.rename(from, alt);
    log.push({ from, to: alt, note: "dest existed" });
    return;
  }
  await fs.rename(from, to);
  log.push({ from, to });
}

async function listFiles(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).filter((e) => e.isFile());
  } catch {
    return [];
  }
}
async function listDirs(dir) {
  try {
    return (await fs.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory());
  } catch {
    return [];
  }
}

// ——— 1 MARKETING ———
async function arrangeMarketing() {
  const M = path.join(ROOT, "marketing");
  const hero = path.join(M, "hero");
  await ensure(path.join(hero, "slides"));
  await ensure(path.join(hero, "pages"));
  await ensure(path.join(hero, "installs"));
  await ensure(path.join(hero, "products")); // product category hero stills

  const heroFiles = await listFiles(hero);
  for (const f of heroFiles) {
    const n = f.name.toLowerCase();
    if (n === ".gitkeep") continue;
    let destSub = "pages";
    if (/^hero[- ]?\d|^hero copy|^home-poster/.test(n)) destSub = "slides";
    else if (
      /titan|tvs|dmrc|usha|franklin|patna/.test(n) &&
      !/poster/.test(n)
    )
      destSub = "installs";
    else if (/chairs|workstations|educational|products-poster/.test(n))
      destSub = "products";
    else if (/poster|about|admin|career|contact|download|planning|service|showroom|solution|trusted/.test(n))
      destSub = "pages";
    await move(path.join(hero, f.name), path.join(hero, destSub, f.name));
  }

  // client-logos → one subfolder per brand (stem without ext)
  const logos = path.join(M, "client-logos");
  const logoFiles = await listFiles(logos);
  const byStem = new Map();
  for (const f of logoFiles) {
    if (f.name === ".gitkeep") continue;
    const stem = f.name.replace(/\.(webp|png|jpe?g)$/i, "");
    if (!byStem.has(stem)) byStem.set(stem, []);
    byStem.get(stem).push(f.name);
  }
  for (const [stem, names] of byStem) {
    const dir = path.join(logos, stem);
    await ensure(dir);
    for (const name of names) {
      await move(path.join(logos, name), path.join(dir, name));
    }
  }

  // projects loose files → projects/_shared
  const projects = path.join(M, "projects");
  await ensure(path.join(projects, "_shared"));
  for (const f of await listFiles(projects)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(projects, f.name), path.join(projects, "_shared", f.name));
  }
  // each project client: gallery subfolder for non-hero files
  for (const d of await listDirs(projects)) {
    if (d.name.startsWith("_") || d.name === ".gitkeep") continue;
    const pdir = path.join(projects, d.name);
    await ensure(path.join(pdir, "gallery"));
    for (const f of await listFiles(pdir)) {
      if (f.name === ".gitkeep") continue;
      const n = f.name.toLowerCase();
      if (n === "hero.webp" || n.startsWith("hero.")) continue; // keep hero at client root
      await move(path.join(pdir, f.name), path.join(pdir, "gallery", f.name));
    }
  }

  // montage → montage/items
  const mon = path.join(M, "montage");
  await ensure(path.join(mon, "items"));
  for (const f of await listFiles(mon)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(mon, f.name), path.join(mon, "items", f.name));
  }

  // team → team/portraits
  const team = path.join(M, "team");
  await ensure(path.join(team, "portraits"));
  for (const f of await listFiles(team)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(team, f.name), path.join(team, "portraits", f.name));
  }

  // partners → partners/logos
  const partners = path.join(M, "partners");
  await ensure(path.join(partners, "logos"));
  for (const f of await listFiles(partners)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(partners, f.name), path.join(partners, "logos", f.name));
  }

  // brand → brand/logos
  const brand = path.join(M, "brand");
  await ensure(path.join(brand, "logos"));
  for (const f of await listFiles(brand)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(brand, f.name), path.join(brand, "logos", f.name));
  }

  // fallback → keep files; add raster/ sub for placeholders
  const fb = path.join(M, "fallback");
  await ensure(path.join(fb, "placeholders"));
  for (const f of await listFiles(fb)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(fb, f.name), path.join(fb, "placeholders", f.name));
  }

  // home already has client-logos + workspaces — ensure workspaces files stay; optional gallery N/A
}

// ——— 3 PLANNER ———
async function arrangePlanner() {
  const P = path.join(ROOT, "planner");
  const media = path.join(P, "media");
  await ensure(path.join(media, "landing"));
  await ensure(path.join(media, "video"));
  await ensure(path.join(media, "posters"));
  for (const f of await listFiles(media)) {
    if (f.name === ".gitkeep") continue;
    const n = f.name.toLowerCase();
    if (n.endsWith(".mp4") || n.endsWith(".webm")) {
      await move(path.join(media, f.name), path.join(media, "video", f.name));
    } else if (/poster/.test(n)) {
      await move(path.join(media, f.name), path.join(media, "posters", f.name));
    } else {
      await move(path.join(media, f.name), path.join(media, "landing", f.name));
    }
  }
}

// ——— 4 STUDIO ———
async function arrangeStudio() {
  const S = path.join(ROOT, "studio");
  await ensure(path.join(S, "media", "previews"));
  await ensure(path.join(S, "media", "exports"));
  await ensure(path.join(S, "docs"));
  // touch gitkeeps
  for (const p of [
    path.join(S, "media", "previews", ".gitkeep"),
    path.join(S, "media", "exports", ".gitkeep"),
    path.join(S, "docs", ".gitkeep"),
  ]) {
    if (!(await exists(p))) await fs.writeFile(p, "");
  }
}

// ——— 2 CATALOG ———
async function arrangeCatalog() {
  const C = path.join(ROOT, "catalog");
  const families = [
    "seating",
    "workstations",
    "tables",
    "storage",
    "soft-seating",
    "educational",
    "collaborative",
  ];

  for (const fam of families) {
    const famDir = path.join(C, fam);
    for (const d of await listDirs(famDir)) {
      if (d.name.startsWith("_")) continue; // legacy / quarantine groups stay
      const sku = path.join(famDir, d.name);
      const gallery = path.join(sku, "gallery");
      await ensure(gallery);
      // move image-* into gallery; leave .gitkeep; move other media to detail or quarantine
      for (const f of await listFiles(sku)) {
        if (f.name === ".gitkeep") continue;
        const n = f.name.toLowerCase();
        if (n.startsWith("image-")) {
          await move(path.join(sku, f.name), path.join(gallery, f.name));
        } else if (/\.(webp|jpe?g|png)$/i.test(n)) {
          await ensure(path.join(sku, "detail"));
          await move(path.join(sku, f.name), path.join(sku, "detail", f.name));
        }
      }
    }
  }

  // flagship → flagship/categories (files stay grouped)
  const fl = path.join(C, "flagship");
  await ensure(path.join(fl, "categories"));
  for (const f of await listFiles(fl)) {
    if (f.name === ".gitkeep") continue;
    await move(path.join(fl, f.name), path.join(fl, "categories", f.name));
  }

  // products already has imported/, seating/, legacy-flat/ — add README structure only
  const prod = path.join(C, "products");
  await ensure(path.join(prod, "imported"));
  await ensure(path.join(prod, "legacy-flat"));
  // imported slug folders: if files at slug root, put under gallery
  const imported = path.join(prod, "imported");
  for (const d of await listDirs(imported)) {
    if (d.name.startsWith("_")) continue;
    const slugDir = path.join(imported, d.name);
    const gallery = path.join(slugDir, "gallery");
    const files = await listFiles(slugDir);
    if (files.some((f) => f.name !== ".gitkeep")) {
      await ensure(gallery);
      for (const f of files) {
        if (f.name === ".gitkeep") continue;
        if (/\.(webp|jpe?g|png)$/i.test(f.name)) {
          await move(path.join(slugDir, f.name), path.join(gallery, f.name));
        }
      }
    }
  }
}

async function snapshot(title) {
  const lines = [title, ""];
  async function walk(dir, depth) {
    if (depth > 4) return;
    const ents = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    ents.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of ents) {
      if (e.name === ".gitkeep") continue;
      const pad = "  ".repeat(depth);
      if (e.isDirectory()) {
        lines.push(`${pad}${e.name}/`);
        await walk(path.join(dir, e.name), depth + 1);
      } else if (depth <= 2) {
        lines.push(`${pad}${e.name}`);
      }
    }
  }
  await walk(ROOT, 0);
  return lines.join("\n");
}

async function main() {
  console.log("1 marketing…");
  await arrangeMarketing();
  console.log("3 planner…");
  await arrangePlanner();
  console.log("4 studio…");
  await arrangeStudio();
  console.log("2 catalog…");
  await arrangeCatalog();

  const tree = await snapshot("# Arranged tree (depth 4)");
  await ensure(path.resolve("results/asset-cutover"));
  await fs.writeFile(
    path.resolve("results/asset-cutover/arrange-pass-order.md"),
    [
      "# Arrange pass: marketing → planner → studio → catalog",
      "",
      `Ops logged: ${log.length} moves`,
      "",
      "Order requested: 1st marketing, 3rd planner, 4th studio, then 2nd catalog.",
      "Each domain uses multiple sub and sub-sub folders.",
      "",
      "```",
      tree,
      "```",
      "",
    ].join("\n"),
  );
  await fs.writeFile(
    path.resolve("results/asset-cutover/arrange-pass-log.json"),
    JSON.stringify({ count: log.length, sample: log.slice(0, 100) }, null, 2),
  );
  console.log("DONE moves", log.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
