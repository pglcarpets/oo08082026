/**
 * Shared recovery → major classification (used by merge + hash-dedup).
 * Extracted from merge-recovery-into-majors.mjs classify section.
 */
import path from "node:path";

export const MEDIA_EXT = new Set([
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

export const FAMILIES = new Set([
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
]);

export const CATEGORY_LEGACY = {
  chairs: "seating/_legacy-chairs",
  "soft-seating": "soft-seating/_legacy-soft-seating",
  workstations: "workstations/_legacy-workstations",
  tables: "tables/_legacy-tables",
  storage: "storage/_legacy-storage",
  educational: "educational/_legacy-educational",
  collaborative: "collaborative/_legacy-collaborative",
};

export const MARKETING_TOPS = new Set([
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

async function _exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function _ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function _freeBytesOnDrive(absPath) {
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

async function* _walkFiles(dir) {
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

function _posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

export function dumpKindFromName(folderName) {
  const n = folderName.toLowerCase();
  if (n.endsWith("-public-clientlogos") || n.includes("clientlogos")) return "ClientLogos";
  if (n.endsWith("-public-clientphotos") || n.includes("clientphotos")) return "ClientPhotos";
  if (n.endsWith("-public-showroom") || n.endsWith("-showroom")) return "Showroom";
  return "images";
}

export function stripKnownPrefixes(rel) {
  let r = rel.replace(/\\/g, "/");
  // drop leading images/ public/ assets/ if present
  r = r.replace(/^(images|public|assets)\//i, "");
  r = r.replace(/^site\/public\/(images|assets)\//i, "");
  return r;
}

export function oandoFamily(dirName) {
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

export function heroSubfolder(fileName) {
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

export function roleForCatalogFile(base) {
  if (/^image[-_]?\d/i.test(base)) return "gallery";
  if (/\.(webp|jpe?g|png|gif|avif)$/i.test(base)) return "detail";
  return "gallery";
}

/**
 * Map a recovery-relative path to dest under assets/.
 * Returns { major, destRel } where destRel is relative to assets/.
 */
export function classify(relRaw, sourceTag, kind) {
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

export function placeOandoSku(info, restParts, base) {
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

export function mapCatalog(partsAfterCatalog, base, _fullRel) {
  if (!partsAfterCatalog.length) {
    return {
      major: "catalog",
      destRel: `catalog/_inbox/${base}`,
      class: "catalog.inbox",
    };
  }
  const p0 = partsAfterCatalog[0];
  const p0l = p0.toLowerCase();
  const p0ext = path.extname(p0).toLowerCase();

  // Flat media file directly under catalog/ (not a SKU folder)
  if (
    partsAfterCatalog.length === 1 &&
    MEDIA_EXT.has(p0ext)
  ) {
    return {
      major: "catalog",
      destRel: `catalog/products/legacy-flat/${base}`,
      class: "catalog.products.legacy-flat",
    };
  }

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

export function mapProducts(partsAfterProducts, base) {
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

export function mapMarketing(parts, base, _hintTop) {
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

export function mapPlanner(parts, base) {
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

