/**
 * Merge recovery media into major asset dirs:
 *   site/public/assets/{marketing,catalog,planner,studio,others}/
 *
 * Source (read-only):
 *   site/public/assets/others/legacy/recovery/{from-e,from-d}/**
 *
 * Policy:
 *  - Copy only (never delete recovery or existing larger files)
 *  - Dest exists: keep larger; same size → skip; never overwrite larger with smaller
 *  - Prefer webp: if copying raster and sibling .webp exists at dest, skip (or park jpg under _originals/)
 *  - Stop if E: free < 10 GB
 *  - Batched by recovery source folder
 *
 * Usage (from repo root):
 *   node scripts/merge-recovery-into-majors.mjs
 *   node scripts/merge-recovery-into-majors.mjs --dry
 *   node scripts/merge-recovery-into-majors.mjs --only from-e
 *   node scripts/merge-recovery-into-majors.mjs --limit 500
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const ASSETS = path.join(REPO, "site/public/assets");
const RECOVERY = path.join(ASSETS, "others/legacy/recovery");
const LOG_DIR = path.join(REPO, "results/asset-cutover");
const MIN_FREE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
const FREE_CHECK_EVERY = 250;

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ONLY = (() => {
  const i = args.indexOf("--only");
  return i >= 0 ? args[i + 1] : null;
})();
const LIMIT = (() => {
  const i = args.indexOf("--limit");
  return i >= 0 ? Number(args[i + 1]) || 0 : 0;
})();

const MEDIA_EXT = new Set([
  ".webp",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
  ".avif",
  ".mp4",
  ".webm",
  ".ico",
  ".glb",
  ".gltf",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
]);

const FAMILIES = new Set([
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
]);

const CATEGORY_LEGACY = {
  chairs: "seating/_legacy-chairs",
  "soft-seating": "soft-seating/_legacy-soft-seating",
  workstations: "workstations/_legacy-workstations",
  tables: "tables/_legacy-tables",
  storage: "storage/_legacy-storage",
  educational: "educational/_legacy-educational",
  collaborative: "collaborative/_legacy-collaborative",
};

const MARKETING_TOPS = new Set([
  "hero",
  "client-logos",
  "clientlogos",
  "projects",
  "clientphotos",
  "client-photos",
  "client-projects",
  "showroom",
  "brand",
  "home",
  "montage",
  "partners",
  "team",
  "fallback",
  "backgrounds",
]);

// ——— filesystem helpers ———

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function freeBytesOnDrive(absPath) {
  // Windows: use wmic / powershell via fs.statfs when available (Node 18.15+)
  if (typeof fs.statfs === "function") {
    try {
      const s = await fs.statfs(path.parse(absPath).root || absPath);
      return Number(s.bfree) * Number(s.bsize);
    } catch {
      /* fall through */
    }
  }
  // Fallback PowerShell
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const drive = path.parse(absPath).root.replace(/\\$/, "");
  const { stdout } = await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `(Get-PSDrive -Name '${drive.replace(":", "")}').Free`,
    ],
    { windowsHide: true },
  );
  return Number(String(stdout).trim());
}

async function* walkFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // never re-enter recovery-merged deposits
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === ".next")
        continue;
      yield* walkFiles(full);
    } else if (ent.isFile()) {
      yield full;
    }
  }
}

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function dumpKindFromName(folderName) {
  const n = folderName.toLowerCase();
  if (n.endsWith("-public-clientlogos") || n.includes("clientlogos")) return "ClientLogos";
  if (n.endsWith("-public-clientphotos") || n.includes("clientphotos")) return "ClientPhotos";
  if (n.endsWith("-public-showroom") || n.endsWith("-showroom")) return "Showroom";
  return "images";
}

function stripKnownPrefixes(rel) {
  let r = rel.replace(/\\/g, "/");
  // drop leading images/ public/ assets/ if present
  r = r.replace(/^(images|public|assets)\//i, "");
  r = r.replace(/^site\/public\/(images|assets)\//i, "");
  return r;
}

function oandoFamily(dirName) {
  const m = dirName.match(/^oando-([a-z0-9-]+)--(.+)$/i);
  if (!m) return null;
  const fam = m[1].toLowerCase();
  if (FAMILIES.has(fam)) return { family: fam, slug: dirName };
  // soft seating sometimes encoded as oando-soft-seating--x
  if (fam.startsWith("soft-seating") || fam === "softseating") {
    return { family: "soft-seating", slug: dirName };
  }
  return { family: fam, slug: dirName };
}

function heroSubfolder(fileName) {
  const n = fileName.toLowerCase();
  if (/^hero[- ]?\d|^hero copy|^home-poster/.test(n)) return "slides";
  if (/titan|tvs|dmrc|usha|franklin|patna/.test(n) && !/poster/.test(n)) return "installs";
  if (/chairs|workstations|educational|products-poster|soft-seating|storage|tables/.test(n))
    return "products";
  if (
    /poster|about|admin|career|contact|download|planning|service|showroom|solution|trusted/.test(
      n,
    )
  )
    return "pages";
  return "pages";
}

function roleForCatalogFile(base) {
  if (/^image[-_]?\d/i.test(base)) return "gallery";
  if (/\.(webp|jpe?g|png|gif|avif)$/i.test(base)) return "detail";
  return "gallery";
}

/**
 * Map a recovery-relative path to dest under assets/.
 * Returns { major, destRel } where destRel is relative to assets/.
 */
function classify(relRaw, sourceTag, kind) {
  const rel = stripKnownPrefixes(relRaw);
  const lower = rel.toLowerCase();
  const parts = rel.split("/").filter(Boolean);
  const base = parts[parts.length - 1] || "";
  const ext = path.extname(base).toLowerCase();

  // Special dump roots
  if (kind === "ClientLogos") {
    const stem = base.replace(/\.(webp|png|jpe?g|svg|gif|avif)$/i, "");
    return {
      major: "marketing",
      destRel: `marketing/client-logos/${stem}/${base}`,
      class: "marketing.client-logos",
    };
  }
  if (kind === "ClientPhotos") {
    if (parts.length <= 1) {
      return {
        major: "marketing",
        destRel: `marketing/projects/_shared/gallery/${base}`,
        class: "marketing.projects.shared",
      };
    }
    const client = parts[0];
    if (parts.length === 2) {
      return {
        major: "marketing",
        destRel: `marketing/projects/${client}/gallery/${base}`,
        class: "marketing.projects.gallery",
      };
    }
    // deeper: keep under projects/client/...
    return {
      major: "marketing",
      destRel: `marketing/projects/${parts.join("/")}`,
      class: "marketing.projects.nested",
    };
  }
  if (kind === "Showroom") {
    return {
      major: "marketing",
      destRel: `marketing/projects/Showroom/gallery/${base}`,
      class: "marketing.projects.showroom",
    };
  }

  // Root backgrounds
  if (
    parts.length === 1 &&
    /^(auth_background|hero_background)\./i.test(base)
  ) {
    return {
      major: "marketing",
      destRel: `marketing/backgrounds/${base}`,
      class: "marketing.backgrounds",
    };
  }

  // Already under major domains
  if (lower.startsWith("marketing/")) {
    return mapMarketing(parts.slice(1), base, "marketing");
  }
  if (lower.startsWith("catalog/")) {
    return mapCatalog(parts.slice(1), base, rel);
  }
  if (lower.startsWith("planner/")) {
    return mapPlanner(parts.slice(1), base);
  }
  if (lower.startsWith("studio/")) {
    return {
      major: "studio",
      destRel: `studio/${parts.slice(1).join("/") || base}`,
      class: "studio",
    };
  }
  if (lower.startsWith("others/")) {
    // don't re-copy recovery tree into itself
    if (lower.startsWith("others/legacy/recovery")) {
      return { major: "skip", destRel: null, class: "skip.recovery-self" };
    }
    return {
      major: "others",
      destRel: `others/${parts.slice(1).join("/")}`,
      class: "others.passthrough",
    };
  }

  // Top-level marketing folders
  const top = (parts[0] || "").toLowerCase();
  if (MARKETING_TOPS.has(top) || top === "client-projects") {
    return mapMarketing(parts, base, top);
  }

  // Category dumps → catalog legacy
  if (CATEGORY_LEGACY[top]) {
    const nested = parts.slice(1).join("/");
    // if file looks like oando sku folder first segment
    if (parts[1] && oandoFamily(parts[1])) {
      const info = oandoFamily(parts[1]);
      const rest = parts.slice(2);
      return placeOandoSku(info, rest, base);
    }
    const destNested = nested ? `${CATEGORY_LEGACY[top]}/${nested}` : `${CATEGORY_LEGACY[top]}/${base}`;
    // if only file under category root, put under gallery-ish flat
    if (parts.length === 2) {
      return {
        major: "catalog",
        destRel: `catalog/${CATEGORY_LEGACY[top]}/${base}`,
        class: `catalog.legacy.${top}`,
      };
    }
    return {
      major: "catalog",
      destRel: `catalog/${destNested}`,
      class: `catalog.legacy.${top}`,
    };
  }

  // products/
  if (top === "products") {
    return mapProducts(parts.slice(1), base);
  }

  // bare oando-* at top
  if (parts[0] && oandoFamily(parts[0])) {
    return placeOandoSku(oandoFamily(parts[0]), parts.slice(1), base);
  }

  // planner signals anywhere
  if (/planner/i.test(rel) || /\/media\/(video|poster)/i.test(rel)) {
    return mapPlanner(parts, base);
  }

  // studio signals
  if (/(^|\/)studio(\/|$)/i.test(rel)) {
    return {
      major: "studio",
      destRel: `studio/media/from-recovery/${sourceTag}/${rel}`,
      class: "studio.recovery",
    };
  }

  // fonts / vendor / icons / models / cdn catalogs
  if (
    /^(fonts|vendor|icons|models|cdn|svg-catalog|png-catalog|logos)(\/|$)/i.test(
      lower,
    ) ||
    /\.(woff2?|ttf|otf|eot|glb|gltf)$/i.test(ext)
  ) {
    const bucket = /\.(woff2?|ttf|otf|eot)$/i.test(ext)
      ? "fonts"
      : /\.(glb|gltf)$/i.test(ext)
        ? "vendor/models"
        : top || "misc";
    return {
      major: "others",
      destRel: `others/${bucket === top ? rel : `${bucket}/from-recovery/${sourceTag}/${base}`}`,
      class: "others.system",
    };
  }

  // backend-architecture etc non-content
  if (top === "backend-architecture" || top === "docs") {
    return {
      major: "others",
      destRel: `others/misc/from-recovery/${sourceTag}/${rel}`,
      class: "others.misc",
    };
  }

  // unmatched media → others/misc/from-recovery
  if (MEDIA_EXT.has(ext) || !ext) {
    return {
      major: "others",
      destRel: `others/misc/from-recovery/${sourceTag}/${rel}`,
      class: "others.unmatched",
    };
  }

  return {
    major: "others",
    destRel: `others/misc/from-recovery/${sourceTag}/${rel}`,
    class: "others.unmatched",
  };
}

function placeOandoSku(info, restParts, base) {
  const { family, slug } = info;
  // rest may include gallery/, detail/, or bare image-N
  const rest = restParts.filter(Boolean);
  if (rest.length === 0) {
    // file is the sku name somehow — shouldn't happen for files
    return {
      major: "catalog",
      destRel: `catalog/${family}/${slug}/gallery/${base}`,
      class: `catalog.${family}.sku`,
    };
  }
  // if already gallery/detail
  const first = rest[0].toLowerCase();
  if (first === "gallery" || first === "detail" || first === "thumb" || first === "_quarantine" || first === "_originals") {
    return {
      major: "catalog",
      destRel: `catalog/${family}/${slug}/${rest.join("/")}`,
      class: `catalog.${family}.sku`,
    };
  }
  // bare files under sku
  if (rest.length === 1) {
    const role = roleForCatalogFile(base);
    return {
      major: "catalog",
      destRel: `catalog/${family}/${slug}/${role}/${base}`,
      class: `catalog.${family}.sku`,
    };
  }
  // nested unknown under sku → preserve under detail/
  return {
    major: "catalog",
    destRel: `catalog/${family}/${slug}/detail/${rest.join("/")}`,
    class: `catalog.${family}.sku.nested`,
  };
}

function mapCatalog(partsAfterCatalog, base, _fullRel) {
  if (!partsAfterCatalog.length) {
    return {
      major: "catalog",
      destRel: `catalog/_inbox/${base}`,
      class: "catalog.inbox",
    };
  }
  const p0 = partsAfterCatalog[0];
  const p0l = p0.toLowerCase();

  // already family-nested: catalog/seating/oando-...
  if (FAMILIES.has(p0l)) {
    const maybeSku = partsAfterCatalog[1];
    if (maybeSku && oandoFamily(maybeSku)) {
      return placeOandoSku(oandoFamily(maybeSku), partsAfterCatalog.slice(2), base);
    }
    // legacy or other under family
    return {
      major: "catalog",
      destRel: `catalog/${partsAfterCatalog.join("/")}`,
      class: `catalog.${p0l}.passthrough`,
    };
  }

  // catalog/products/...
  if (p0l === "products") {
    return mapProducts(partsAfterCatalog.slice(1), base);
  }

  // catalog/flagship/...
  if (p0l === "flagship") {
    const rest = partsAfterCatalog.slice(1);
    if (rest.length === 0 || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "catalog",
        destRel: `catalog/flagship/categories/${base}`,
        class: "catalog.flagship",
      };
    }
    return {
      major: "catalog",
      destRel: `catalog/flagship/${rest.join("/")}`,
      class: "catalog.flagship",
    };
  }

  // catalog/oando-*
  if (oandoFamily(p0)) {
    return placeOandoSku(oandoFamily(p0), partsAfterCatalog.slice(1), base);
  }

  // catalog/fluid-x etc non-oando sku dirs
  if (partsAfterCatalog.length >= 1 && !p0l.startsWith("_")) {
    // guess family from name keywords
    let family = "seating";
    if (/workstation|desk|bench|panel|fenix|trio|curvivo|sleek|adaptable|hat/i.test(p0))
      family = "workstations";
    else if (/table|meet|opus|consulate|presidency/i.test(p0)) family = "tables";
    else if (/storage|locker|pedestal|rack|compactor/i.test(p0)) family = "storage";
    else if (/pod|cocoon|solace/i.test(p0)) family = "collaborative";
    else if (/academia|learn|edu|podium|bed|class/i.test(p0)) family = "educational";

    const rest = partsAfterCatalog.slice(1);
    if (rest.length === 0 || (rest.length === 1 && rest[0] === base)) {
      const role = roleForCatalogFile(base);
      return {
        major: "catalog",
        destRel: `catalog/${family}/${p0}/${role}/${base}`,
        class: `catalog.${family}.named`,
      };
    }
    return {
      major: "catalog",
      destRel: `catalog/${family}/${p0}/${rest.join("/")}`,
      class: `catalog.${family}.named`,
    };
  }

  return {
    major: "catalog",
    destRel: `catalog/${partsAfterCatalog.join("/")}`,
    class: "catalog.passthrough",
  };
}

function mapProducts(partsAfterProducts, base) {
  if (!partsAfterProducts.length) {
    return {
      major: "catalog",
      destRel: `catalog/products/legacy-flat/${base}`,
      class: "catalog.products.legacy-flat",
    };
  }
  const p0 = partsAfterProducts[0].toLowerCase();
  if (p0 === "imported") {
    // products/imported/<slug>/file → catalog/products/imported/<slug>/gallery|...
    const rest = partsAfterProducts.slice(1);
    if (rest.length === 0) {
      return {
        major: "catalog",
        destRel: `catalog/products/legacy-flat/${base}`,
        class: "catalog.products.legacy-flat",
      };
    }
    if (rest.length === 1) {
      // file directly under imported/ — flat import
      return {
        major: "catalog",
        destRel: `catalog/products/imported/_loose/${base}`,
        class: "catalog.products.imported.loose",
      };
    }
    const slug = rest[0];
    const deeper = rest.slice(1);
    if (deeper.length === 1 || (deeper.length === 0)) {
      const role = roleForCatalogFile(base);
      // if only slug/file
      if (deeper.length === 1 && deeper[0] === base) {
        return {
          major: "catalog",
          destRel: `catalog/products/imported/${slug}/${role}/${base}`,
          class: "catalog.products.imported",
        };
      }
    }
    const first = deeper[0]?.toLowerCase();
    if (first === "gallery" || first === "detail") {
      return {
        major: "catalog",
        destRel: `catalog/products/imported/${slug}/${deeper.join("/")}`,
        class: "catalog.products.imported",
      };
    }
    if (deeper.length === 1) {
      const role = roleForCatalogFile(base);
      return {
        major: "catalog",
        destRel: `catalog/products/imported/${slug}/${role}/${base}`,
        class: "catalog.products.imported",
      };
    }
    return {
      major: "catalog",
      destRel: `catalog/products/imported/${slug}/${deeper.join("/")}`,
      class: "catalog.products.imported",
    };
  }
  if (p0 === "seating" || FAMILIES.has(p0)) {
    return {
      major: "catalog",
      destRel: `catalog/products/${partsAfterProducts.join("/")}`,
      class: "catalog.products.family",
    };
  }
  if (p0 === "legacy-flat") {
    return {
      major: "catalog",
      destRel: `catalog/products/legacy-flat/${partsAfterProducts.slice(1).join("/") || base}`,
      class: "catalog.products.legacy-flat",
    };
  }
  // flat product stills under products/*.webp
  if (partsAfterProducts.length === 1) {
    return {
      major: "catalog",
      destRel: `catalog/products/legacy-flat/${base}`,
      class: "catalog.products.legacy-flat",
    };
  }
  // products/<guess>/...
  return {
    major: "catalog",
    destRel: `catalog/products/imported/${partsAfterProducts.join("/")}`,
    class: "catalog.products.imported.guess",
  };
}

function mapMarketing(parts, base, _hintTop) {
  // parts may include leading top folder
  let p = parts.slice();
  if (!p.length) {
    return {
      major: "marketing",
      destRel: `marketing/_inbox/${base}`,
      class: "marketing.inbox",
    };
  }
  let top = p[0].toLowerCase();
  // normalize aliases
  if (top === "clientlogos") top = "client-logos";
  if (top === "clientphotos" || top === "client-photos" || top === "client-projects") {
    // treat as projects (client folder trees or loose files)
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      // loose file under client-projects/ or clientphotos/
      return {
        major: "marketing",
        destRel: `marketing/projects/_shared/gallery/${base}`,
        class: "marketing.projects.shared",
      };
    }
    // client/file → gallery (unless hero.*)
    if (rest.length === 2) {
      const n = rest[1].toLowerCase();
      if (n === "hero.webp" || n.startsWith("hero.")) {
        return {
          major: "marketing",
          destRel: `marketing/projects/${rest[0]}/${rest[1]}`,
          class: "marketing.projects.hero",
        };
      }
      return {
        major: "marketing",
        destRel: `marketing/projects/${rest[0]}/gallery/${rest[1]}`,
        class: "marketing.projects.gallery",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/projects/${rest.join("/")}`,
      class: "marketing.projects",
    };
  }
  if (top === "showroom") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/projects/Showroom/gallery/${base}`,
        class: "marketing.projects.showroom",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/projects/Showroom/${rest.join("/")}`,
      class: "marketing.projects.showroom",
    };
  }

  if (top === "hero") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      const sub = heroSubfolder(base);
      return {
        major: "marketing",
        destRel: `marketing/hero/${sub}/${base}`,
        class: `marketing.hero.${sub}`,
      };
    }
    // already slides/pages/...
    const sub0 = rest[0].toLowerCase();
    if (["slides", "pages", "installs", "products"].includes(sub0)) {
      return {
        major: "marketing",
        destRel: `marketing/hero/${rest.join("/")}`,
        class: `marketing.hero.${sub0}`,
      };
    }
    const sub = heroSubfolder(base);
    return {
      major: "marketing",
      destRel: `marketing/hero/${sub}/${rest.join("/")}`,
      class: `marketing.hero.${sub}`,
    };
  }

  if (top === "client-logos") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      const stem = base.replace(/\.(webp|png|jpe?g|svg|gif|avif)$/i, "");
      return {
        major: "marketing",
        destRel: `marketing/client-logos/${stem}/${base}`,
        class: "marketing.client-logos",
      };
    }
    // already stem/file
    if (rest.length === 1) {
      const stem = rest[0].replace(/\.(webp|png|jpe?g|svg)$/i, "");
      // file named as stem.ext at logos root nested wrong
      return {
        major: "marketing",
        destRel: `marketing/client-logos/${stem}/${rest[0]}`,
        class: "marketing.client-logos",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/client-logos/${rest.join("/")}`,
      class: "marketing.client-logos",
    };
  }

  if (top === "projects") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/projects/_shared/gallery/${base}`,
        class: "marketing.projects.shared",
      };
    }
    if (rest.length === 1) {
      // only client folder name as file? rare
      return {
        major: "marketing",
        destRel: `marketing/projects/_shared/gallery/${rest[0]}`,
        class: "marketing.projects.shared",
      };
    }
    const client = rest[0];
    const deeper = rest.slice(1);
    if (deeper.length === 1) {
      const n = deeper[0].toLowerCase();
      if (n === "hero.webp" || n.startsWith("hero.")) {
        return {
          major: "marketing",
          destRel: `marketing/projects/${client}/${deeper[0]}`,
          class: "marketing.projects.hero",
        };
      }
      return {
        major: "marketing",
        destRel: `marketing/projects/${client}/gallery/${deeper[0]}`,
        class: "marketing.projects.gallery",
      };
    }
    // already has gallery/
    return {
      major: "marketing",
      destRel: `marketing/projects/${rest.join("/")}`,
      class: "marketing.projects",
    };
  }

  if (top === "brand") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/brand/logos/${base}`,
        class: "marketing.brand",
      };
    }
    if (rest[0].toLowerCase() === "logos") {
      return {
        major: "marketing",
        destRel: `marketing/brand/${rest.join("/")}`,
        class: "marketing.brand",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/brand/logos/${rest.join("/")}`,
      class: "marketing.brand",
    };
  }

  if (top === "home") {
    return {
      major: "marketing",
      destRel: `marketing/home/${p.slice(1).join("/") || base}`,
      class: "marketing.home",
    };
  }

  if (top === "montage") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/montage/items/${base}`,
        class: "marketing.montage",
      };
    }
    if (rest[0].toLowerCase() === "items") {
      return {
        major: "marketing",
        destRel: `marketing/montage/${rest.join("/")}`,
        class: "marketing.montage",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/montage/items/${rest.join("/")}`,
      class: "marketing.montage",
    };
  }

  if (top === "partners") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/partners/logos/${base}`,
        class: "marketing.partners",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/partners/${rest[0].toLowerCase() === "logos" ? rest.join("/") : `logos/${rest.join("/")}`}`,
      class: "marketing.partners",
    };
  }

  if (top === "team") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/team/portraits/${base}`,
        class: "marketing.team",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/team/${rest[0].toLowerCase() === "portraits" ? rest.join("/") : `portraits/${rest.join("/")}`}`,
      class: "marketing.team",
    };
  }

  if (top === "fallback") {
    const rest = p.slice(1);
    if (!rest.length || (rest.length === 1 && rest[0] === base)) {
      return {
        major: "marketing",
        destRel: `marketing/fallback/placeholders/${base}`,
        class: "marketing.fallback",
      };
    }
    return {
      major: "marketing",
      destRel: `marketing/fallback/${rest.join("/")}`,
      class: "marketing.fallback",
    };
  }

  if (top === "backgrounds") {
    return {
      major: "marketing",
      destRel: `marketing/backgrounds/${p.slice(1).join("/") || base}`,
      class: "marketing.backgrounds",
    };
  }

  // default marketing preserve
  return {
    major: "marketing",
    destRel: `marketing/${p.join("/")}`,
    class: "marketing.passthrough",
  };
}

function mapPlanner(parts, base) {
  const joined = parts.join("/").toLowerCase();
  const n = base.toLowerCase();
  if (n.endsWith(".mp4") || n.endsWith(".webm") || joined.includes("/video/")) {
    return {
      major: "planner",
      destRel: `planner/media/video/${base}`,
      class: "planner.video",
    };
  }
  if (/poster/.test(n) || joined.includes("poster")) {
    return {
      major: "planner",
      destRel: `planner/media/posters/${base}`,
      class: "planner.posters",
    };
  }
  return {
    major: "planner",
    destRel: `planner/media/landing/${base}`,
    class: "planner.landing",
  };
}

// ——— copy decision ———

/**
 * @returns {'copied'|'skipped_same'|'skipped_dest_larger'|'skipped_webp_prefer'|'skipped_self'|'error'|'dry'}
 */
async function decideAndCopy(src, destAbs, srcSize) {
  if (path.resolve(src) === path.resolve(destAbs)) {
    return { action: "skipped_self", bytes: 0 };
  }
  // Prefer webp: if copying jpg/png and dest webp exists, skip raster
  const ext = path.extname(destAbs).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg" || ext === ".png") {
    const webpDest = destAbs.replace(/\.(jpe?g|png)$/i, ".webp");
    if (await exists(webpDest)) {
      // park original under sibling _originals if we want to keep source raster for archival
      // policy: skip jpg when webp present
      return { action: "skipped_webp_prefer", bytes: 0 };
    }
  }

  if (await exists(destAbs)) {
    let destSize = 0;
    try {
      destSize = (await fs.stat(destAbs)).size;
    } catch {
      destSize = 0;
    }
    if (destSize > srcSize) {
      return { action: "skipped_dest_larger", bytes: 0, destSize, srcSize };
    }
    if (destSize === srcSize) {
      return { action: "skipped_same", bytes: 0, destSize, srcSize };
    }
    // dest smaller → overwrite with larger source
  }

  if (DRY) {
    return { action: "dry", bytes: srcSize };
  }

  await ensureDir(path.dirname(destAbs));
  try {
    await fs.copyFile(src, destAbs);
    return { action: "copied", bytes: srcSize };
  } catch (err) {
    return { action: "error", bytes: 0, error: String(err && err.message ? err.message : err) };
  }
}

// ——— main ———

async function listSourceBatches() {
  const batches = [];
  for (const tag of ["from-e", "from-d"]) {
    if (ONLY && ONLY !== tag && ONLY !== "all") {
      // allow --only from-e or a specific dump folder name
      if (!ONLY.startsWith(tag) && ONLY !== tag) {
        // if ONLY is a dump folder name, still scan both for match
      }
    }
    const root = path.join(RECOVERY, tag);
    if (!(await exists(root))) continue;
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      if (ONLY && ONLY !== "all" && ONLY !== tag && ent.name !== ONLY) continue;
      batches.push({
        sourceTag: tag,
        dumpName: ent.name,
        kind: dumpKindFromName(ent.name),
        root: path.join(root, ent.name),
      });
    }
  }
  return batches;
}

async function main() {
  const started = new Date();
  console.log(`[merge-recovery] repo=${REPO} dry=${DRY} only=${ONLY || "all"} limit=${LIMIT || "none"}`);

  if (!(await exists(RECOVERY))) {
    console.error("Recovery root missing:", RECOVERY);
    process.exit(1);
  }

  let freeStart = 0;
  try {
    freeStart = await freeBytesOnDrive(ASSETS);
  } catch (e) {
    console.warn("free space check failed:", e.message);
  }
  console.log(`[merge-recovery] free start: ${(freeStart / 1e9).toFixed(2)} GB`);

  if (freeStart > 0 && freeStart < MIN_FREE_BYTES) {
    console.error("Abort: free space < 10 GB");
    process.exit(2);
  }

  const stats = {
    startedAt: started.toISOString(),
    dry: DRY,
    freeStartBytes: freeStart,
    freeEndBytes: null,
    processed: 0,
    byMajor: {
      marketing: { copied: 0, bytes: 0 },
      catalog: { copied: 0, bytes: 0 },
      planner: { copied: 0, bytes: 0 },
      studio: { copied: 0, bytes: 0 },
      others: { copied: 0, bytes: 0 },
    },
    byClass: {},
    actions: {
      copied: 0,
      skipped_same: 0,
      skipped_dest_larger: 0,
      skipped_webp_prefer: 0,
      skipped_self: 0,
      skipped_non_media: 0,
      skip_recovery_self: 0,
      dry: 0,
      error: 0,
      stopped_low_space: 0,
    },
    copiedBytes: 0,
    errors: [],
    samples: { copied: [], skipped_dest_larger: [], unmatched: [] },
    batches: [],
  };

  const batches = await listSourceBatches();
  console.log(`[merge-recovery] batches: ${batches.length}`);

  let stopLowSpace = false;
  let globalCount = 0;

  for (const batch of batches) {
    if (stopLowSpace) break;
    if (LIMIT && globalCount >= LIMIT) break;

    const batchStat = {
      dump: batch.dumpName,
      sourceTag: batch.sourceTag,
      kind: batch.kind,
      seen: 0,
      copied: 0,
      skipped: 0,
      errors: 0,
      bytes: 0,
    };
    console.log(`\n==> ${batch.sourceTag}/${batch.dumpName} (${batch.kind})`);

    for await (const file of walkFiles(batch.root)) {
      if (LIMIT && globalCount >= LIMIT) break;
      if (stopLowSpace) break;

      globalCount++;
      batchStat.seen++;
      stats.processed++;

      const ext = path.extname(file).toLowerCase();
      // always consider media; also allow known system assets
      if (!MEDIA_EXT.has(ext) && ext !== "") {
        // skip junk (json, md, ds_store) unless under fonts etc
        if (!/\.(json|md|txt|html|css|js|map|ds_store|gitkeep)$/i.test(ext)) {
          // still try classify unknown binaries? skip non-media
          stats.actions.skipped_non_media++;
          continue;
        } else {
          stats.actions.skipped_non_media++;
          continue;
        }
      }

      let srcSize = 0;
      try {
        srcSize = (await fs.stat(file)).size;
      } catch (e) {
        stats.actions.error++;
        batchStat.errors++;
        if (stats.errors.length < 50) {
          stats.errors.push({ file, error: String(e.message || e) });
        }
        continue;
      }

      const rel = posixRel(batch.root, file);
      const decision = classify(rel, `${batch.sourceTag}/${batch.dumpName}`, batch.kind);

      stats.byClass[decision.class] = (stats.byClass[decision.class] || 0) + 1;

      if (decision.major === "skip" || !decision.destRel) {
        stats.actions.skip_recovery_self++;
        continue;
      }

      // safety: never write into recovery source tree
      const destAbs = path.join(ASSETS, decision.destRel);
      const destNorm = path.resolve(destAbs).toLowerCase();
      const recoveryNorm = path.resolve(RECOVERY).toLowerCase();
      if (destNorm.startsWith(recoveryNorm + path.sep) || destNorm === recoveryNorm) {
        stats.actions.skip_recovery_self++;
        continue;
      }

      if (decision.class === "others.unmatched" && stats.samples.unmatched.length < 30) {
        stats.samples.unmatched.push({ rel, dest: decision.destRel, src: batch.dumpName });
      }

      const result = await decideAndCopy(file, destAbs, srcSize);
      stats.actions[result.action] = (stats.actions[result.action] || 0) + 1;

      if (result.action === "copied" || result.action === "dry") {
        batchStat.copied++;
        batchStat.bytes += result.bytes || 0;
        stats.copiedBytes += result.bytes || 0;
        if (stats.byMajor[decision.major]) {
          stats.byMajor[decision.major].copied++;
          stats.byMajor[decision.major].bytes += result.bytes || 0;
        }
        if (result.action === "copied" && stats.samples.copied.length < 40) {
          stats.samples.copied.push({
            from: rel,
            to: decision.destRel,
            major: decision.major,
            bytes: result.bytes,
            dump: batch.dumpName,
          });
        }
      } else if (result.action === "error") {
        batchStat.errors++;
        if (stats.errors.length < 80) {
          stats.errors.push({
            file,
            dest: decision.destRel,
            error: result.error,
          });
        }
      } else {
        batchStat.skipped++;
        if (
          result.action === "skipped_dest_larger" &&
          stats.samples.skipped_dest_larger.length < 20
        ) {
          stats.samples.skipped_dest_larger.push({
            rel,
            dest: decision.destRel,
            srcSize: result.srcSize,
            destSize: result.destSize,
          });
        }
      }

      if (stats.processed % FREE_CHECK_EVERY === 0) {
        try {
          const free = await freeBytesOnDrive(ASSETS);
          if (free < MIN_FREE_BYTES) {
            console.error(
              `\n[merge-recovery] STOP: free ${(free / 1e9).toFixed(2)} GB < 10 GB after ${stats.processed} files`,
            );
            stopLowSpace = true;
            stats.actions.stopped_low_space = 1;
            break;
          }
          if (stats.processed % 2000 === 0) {
            console.log(
              `  … ${stats.processed} files | copied=${stats.actions.copied} skip_same=${stats.actions.skipped_same} free=${(free / 1e9).toFixed(1)}GB`,
            );
          }
        } catch {
          /* ignore free check blips */
        }
      }
    }

    stats.batches.push(batchStat);
    console.log(
      `  done seen=${batchStat.seen} copied=${batchStat.copied} skipped=${batchStat.skipped} err=${batchStat.errors} MB=${(batchStat.bytes / 1e6).toFixed(1)}`,
    );
  }

  let freeEnd = 0;
  try {
    freeEnd = await freeBytesOnDrive(ASSETS);
  } catch {
    freeEnd = 0;
  }
  stats.freeEndBytes = freeEnd;
  stats.endedAt = new Date().toISOString();
  stats.durationSec = Math.round((Date.now() - started.getTime()) / 1000);

  await ensureDir(LOG_DIR);
  const jsonPath = path.join(LOG_DIR, "RECOVERY-MERGE-LOG.json");
  const mdPath = path.join(LOG_DIR, "RECOVERY-MERGE-LOG.md");
  await fs.writeFile(jsonPath, JSON.stringify(stats, null, 2), "utf8");

  const md = renderMarkdown(stats);
  await fs.writeFile(mdPath, md, "utf8");

  // Brief note on CDN structure doc
  await appendCdnNote(stats);

  console.log("\n========== MERGE SUMMARY ==========");
  console.log(`processed: ${stats.processed}`);
  console.log(`copied:    ${stats.actions.copied} (${(stats.copiedBytes / 1e6).toFixed(1)} MB)`);
  console.log(`same:      ${stats.actions.skipped_same}`);
  console.log(`dest>src:  ${stats.actions.skipped_dest_larger}`);
  console.log(`webp pref: ${stats.actions.skipped_webp_prefer}`);
  console.log(`errors:    ${stats.actions.error}`);
  console.log("by major (copied counts):");
  for (const [k, v] of Object.entries(stats.byMajor)) {
    console.log(`  ${k}: ${v.copied} files, ${(v.bytes / 1e6).toFixed(1)} MB`);
  }
  console.log(`free: ${(freeStart / 1e9).toFixed(2)} → ${(freeEnd / 1e9).toFixed(2)} GB`);
  console.log(`log: ${mdPath}`);
  if (stopLowSpace) process.exitCode = 3;
}

function renderMarkdown(stats) {
  const lines = [];
  lines.push("# Recovery merge into major dirs");
  lines.push("");
  lines.push(`**Started:** ${stats.startedAt}`);
  lines.push(`**Ended:** ${stats.endedAt}`);
  lines.push(`**Duration:** ${stats.durationSec}s`);
  lines.push(`**Dry run:** ${stats.dry}`);
  lines.push(
    `**E: free start/end:** ${(stats.freeStartBytes / 1e9).toFixed(2)} GB → ${(stats.freeEndBytes / 1e9).toFixed(2)} GB`,
  );
  lines.push(`**Source:** \`site/public/assets/others/legacy/recovery/{from-e,from-d}/**\``);
  lines.push(`**Dest root:** \`site/public/assets/{marketing,catalog,planner,studio,others}/\``);
  lines.push("");
  lines.push("## Policy");
  lines.push("");
  lines.push("- Copy only; recovery sources untouched");
  lines.push("- Dest exists: keep larger; same size skip; never overwrite larger with smaller");
  lines.push("- Prefer webp: skip jpg/png when sibling `.webp` already at dest");
  lines.push("- Stop if free &lt; 10 GB");
  lines.push("- Bulk binaries not git-added; see gitignore for recovery + from-recovery deposits");
  lines.push("");
  lines.push("## Totals");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Files processed | ${stats.processed} |`);
  lines.push(`| **Copied** | **${stats.actions.copied}** |`);
  lines.push(`| Copied bytes | ${(stats.copiedBytes / 1e6).toFixed(1)} MB |`);
  lines.push(`| Skipped same size | ${stats.actions.skipped_same} |`);
  lines.push(`| Skipped dest larger | ${stats.actions.skipped_dest_larger} |`);
  lines.push(`| Skipped webp prefer | ${stats.actions.skipped_webp_prefer} |`);
  lines.push(`| Skipped non-media | ${stats.actions.skipped_non_media} |`);
  lines.push(`| Skipped self/recovery | ${(stats.actions.skipped_self || 0) + (stats.actions.skip_recovery_self || 0)} |`);
  lines.push(`| Errors | ${stats.actions.error} |`);
  lines.push(`| Stopped low space | ${stats.actions.stopped_low_space} |`);
  if (stats.dry) lines.push(`| Dry would-copy | ${stats.actions.dry} |`);
  lines.push("");
  lines.push("## Copied per major");
  lines.push("");
  lines.push("| Major | Files copied | MB |");
  lines.push("|-------|-------------:|---:|");
  for (const [k, v] of Object.entries(stats.byMajor)) {
    lines.push(`| ${k} | ${v.copied} | ${(v.bytes / 1e6).toFixed(1)} |`);
  }
  lines.push("");
  lines.push("## Classification counts (all decisions)");
  lines.push("");
  lines.push("| Class | Count |");
  lines.push("|-------|------:|");
  const classes = Object.entries(stats.byClass).sort((a, b) => b[1] - a[1]);
  for (const [c, n] of classes) {
    lines.push(`| \`${c}\` | ${n} |`);
  }
  lines.push("");
  lines.push("## Per recovery batch");
  lines.push("");
  lines.push("| Source | Dump | Kind | Seen | Copied | Skipped | Err | MB |");
  lines.push("|--------|------|------|-----:|-------:|--------:|----:|---:|");
  for (const b of stats.batches) {
    lines.push(
      `| ${b.sourceTag} | \`${b.dump}\` | ${b.kind} | ${b.seen} | ${b.copied} | ${b.skipped} | ${b.errors} | ${(b.bytes / 1e6).toFixed(1)} |`,
    );
  }
  lines.push("");
  if (stats.errors.length) {
    lines.push("## Errors (sample)");
    lines.push("");
    for (const e of stats.errors.slice(0, 40)) {
      lines.push(`- \`${e.file}\` → \`${e.dest || ""}\`: ${e.error}`);
    }
    lines.push("");
  }
  if (stats.samples.copied.length) {
    lines.push("## Sample copies");
    lines.push("");
    for (const s of stats.samples.copied.slice(0, 25)) {
      lines.push(`- \`${s.from}\` → \`${s.to}\` (${s.major}, ${s.bytes} B)`);
    }
    lines.push("");
  }
  if (stats.samples.unmatched.length) {
    lines.push("## Sample unmatched → others/misc/from-recovery");
    lines.push("");
    for (const s of stats.samples.unmatched.slice(0, 20)) {
      lines.push(`- \`${s.rel}\` → \`${s.dest}\``);
    }
    lines.push("");
  }
  lines.push("## Notes");
  lines.push("");
  lines.push("- Overlapping twin trees yield high skip-same rates (expected).");
  lines.push("- Log only is intended for git; bulk media stays on disk.");
  lines.push("- Script: `scripts/merge-recovery-into-majors.mjs`");
  lines.push("");
  return lines.join("\n");
}

async function appendCdnNote(stats) {
  const cdnPath = path.join(LOG_DIR, "CDN-FOLDER-STRUCTURE.md");
  if (!(await exists(cdnPath))) return;
  let text = await fs.readFile(cdnPath, "utf8");
  const marker = "<!-- recovery-merge-note -->";
  const note = [
    "",
    marker,
    "",
    "## Recovery merge (disk)",
    "",
    `On ${stats.endedAt?.slice(0, 10) || "today"}, recovery mirrors under \`others/legacy/recovery/\` were **copied** into the five majors using \`scripts/merge-recovery-into-majors.mjs\`.`,
    "",
    `- Copied: **${stats.actions.copied}** files (${(stats.copiedBytes / 1e6).toFixed(1)} MB new bytes)`,
    `- Skipped same/larger/webp: ${stats.actions.skipped_same + stats.actions.skipped_dest_larger + stats.actions.skipped_webp_prefer}`,
    `- Log: [RECOVERY-MERGE-LOG.md](./RECOVERY-MERGE-LOG.md)`,
    `- Unmatched media: \`others/misc/from-recovery/<source-tag>/\` (gitignored bulk deposit)`,
    `- Recovery sources left intact; do not commit multi-GB merges`,
    "",
  ].join("\n");
  if (text.includes(marker)) {
    // replace from marker to EOF-ish section: simple replace next note block
    const idx = text.indexOf(marker);
    // find end of previous note: keep prefix only then append
    text = text.slice(0, idx).trimEnd() + "\n" + note;
  } else {
    text = text.trimEnd() + "\n" + note;
  }
  await fs.writeFile(cdnPath, text, "utf8");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
