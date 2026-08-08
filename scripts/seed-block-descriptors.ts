/**
 * Seed buyer-facing Oando plan symbols (branded hero set).
 * Run: pnpm --filter oando-site run seed:block-descriptors
 * Then: pnpm --filter oando-site run sync:descriptor-svgs
 * Dual-write publish batch tooling was removed (unwired); use product dual-write path when re-enabled.
 *
 * Counts: 5 desks · 5 workstations · 3 meeting · 4 storage · 1 pedestal · others
 * Names mirror real Oando series (Fluid, Flex, Halo, Omnia, Phoenix, Mozio, Sway…).
 */

import { mkdirSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  resolveBlockDescriptorsDir,
  resolvePublicDir,
} from "../site/lib/paths/sitePackageRoot";
import {
  clearLoaderCache,
  loadAll,
} from "../site/lib/catalog/svg/svgBlockDescriptorLoader";
import { freezeFreshDescriptor } from "../site/lib/catalog/svg/svgTypes";

type SeedInput = {
  readonly id: string;
  readonly slug: string;
  readonly sku: string;
  /** Display name lives in slug humanization + catalog bridge (schema has no name field). */
  readonly geometry: { widthMm: number; depthMm: number; heightMm: number };
  readonly viewBox: { x: number; y: number; width: number; height: number };
  readonly blocks?: ReadonlyArray<{
    id: string;
    x: number;
    y: number;
    width: number;
    depth: number;
  }>;
  readonly maker?: {
    recipe: "linear-desk" | "l-desk";
    widthMm: number;
    depthMm: number;
    topThicknessMm?: number;
    returnWidthMm?: number;
  };
  readonly rovingFocus?: ReadonlyArray<{
    key: string;
    focusSelector: string;
    label: string;
  }>;
  readonly generatedAt: number;
  readonly internal?: boolean;
};

const T = 1_752_000_000;
let n = 0;
const id = () => {
  n += 1;
  return `a81e3a1b-16f4-4000-8000-${String(n).padStart(12, "0")}`;
};

const SEEDS: SeedInput[] = [
  // ── 5 Desks (individual worksurfaces) ──
  {
    id: id(),
    slug: "oando-fluid-desk-1400",
    sku: "OANDO-FLUID-DSK-1400",
    geometry: { widthMm: 1400, depthMm: 700, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1400, height: 700 },
    maker: { recipe: "linear-desk", widthMm: 1400, depthMm: 700, topThicknessMm: 80 },
    rovingFocus: [{ key: "top", focusSelector: "#desk-top", label: "Worksurface" }],
    generatedAt: T + 1,
  },
  {
    id: id(),
    slug: "oando-fluid-desk-1600",
    sku: "OANDO-FLUID-DSK-1600",
    geometry: { widthMm: 1600, depthMm: 800, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1600, height: 800 },
    maker: { recipe: "linear-desk", widthMm: 1600, depthMm: 800, topThicknessMm: 80 },
    rovingFocus: [{ key: "top", focusSelector: "#desk-top", label: "Worksurface" }],
    generatedAt: T + 2,
  },
  {
    id: id(),
    slug: "oando-flex-desk-1200",
    sku: "OANDO-FLEX-DSK-1200",
    geometry: { widthMm: 1200, depthMm: 600, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1200, height: 600 },
    maker: { recipe: "linear-desk", widthMm: 1200, depthMm: 600, topThicknessMm: 70 },
    rovingFocus: [{ key: "top", focusSelector: "#desk-top", label: "Worksurface" }],
    generatedAt: T + 3,
  },
  {
    id: id(),
    slug: "oando-omnia-desk-1800",
    sku: "OANDO-OMNIA-DSK-1800",
    geometry: { widthMm: 1800, depthMm: 900, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1800, height: 900 },
    maker: { recipe: "linear-desk", widthMm: 1800, depthMm: 900, topThicknessMm: 90 },
    rovingFocus: [{ key: "top", focusSelector: "#desk-top", label: "Worksurface" }],
    generatedAt: T + 4,
  },
  {
    id: id(),
    slug: "oando-phoenix-l-desk-1600",
    sku: "OANDO-PHOENIX-L-1600",
    geometry: { widthMm: 1600, depthMm: 1600, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1600, height: 1600 },
    maker: { recipe: "l-desk", widthMm: 1600, depthMm: 800, returnWidthMm: 600 },
    rovingFocus: [{ key: "main", focusSelector: "#main", label: "Main run" }],
    generatedAt: T + 5,
  },

  // ── 5 Workstations (systems / multi-seat footprints) ──
  {
    id: id(),
    slug: "oando-fluid-ws-linear-1200",
    sku: "OANDO-FLUID-WS-L1200",
    geometry: { widthMm: 1200, depthMm: 600, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1200, height: 600 },
    maker: { recipe: "linear-desk", widthMm: 1200, depthMm: 600, topThicknessMm: 75 },
    generatedAt: T + 10,
  },
  {
    id: id(),
    slug: "oando-fluid-ws-linear-1400",
    sku: "OANDO-FLUID-WS-L1400",
    geometry: { widthMm: 1400, depthMm: 700, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1400, height: 700 },
    maker: { recipe: "linear-desk", widthMm: 1400, depthMm: 700, topThicknessMm: 75 },
    generatedAt: T + 11,
  },
  {
    id: id(),
    slug: "oando-fluid-ws-lshape-1600",
    sku: "OANDO-FLUID-WS-LS1600",
    geometry: { widthMm: 1600, depthMm: 1600, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1600, height: 1600 },
    maker: { recipe: "l-desk", widthMm: 1600, depthMm: 800, returnWidthMm: 700 },
    generatedAt: T + 12,
  },
  {
    id: id(),
    slug: "oando-sway-ws-bench-2400",
    sku: "OANDO-SWAY-WS-B2400",
    geometry: { widthMm: 2400, depthMm: 1400, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 2400, height: 1400 },
    blocks: [
      { id: "run-a", x: 0, y: 0, width: 2400, depth: 600 },
      { id: "run-b", x: 0, y: 800, width: 2400, depth: 600 },
      { id: "screen", x: 40, y: 620, width: 2320, depth: 160 },
    ],
    generatedAt: T + 13,
  },
  {
    id: id(),
    slug: "oando-mozio-ws-cluster-1800",
    sku: "OANDO-MOZIO-WS-C1800",
    geometry: { widthMm: 1800, depthMm: 1800, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1800, height: 1800 },
    blocks: [
      { id: "desk-n", x: 300, y: 0, width: 1200, depth: 600 },
      { id: "desk-s", x: 300, y: 1200, width: 1200, depth: 600 },
      { id: "core", x: 700, y: 700, width: 400, depth: 400 },
    ],
    generatedAt: T + 14,
  },

  // ── 3 Meeting tables ──
  {
    id: id(),
    slug: "oando-classy-meeting-1800",
    sku: "OANDO-CLASSY-MTG-1800",
    geometry: { widthMm: 1800, depthMm: 900, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 1800, height: 900 },
    blocks: [
      { id: "tabletop", x: 0, y: 0, width: 1800, depth: 900 },
      { id: "leg-nw", x: 80, y: 80, width: 60, depth: 60 },
      { id: "leg-ne", x: 1660, y: 80, width: 60, depth: 60 },
      { id: "leg-sw", x: 80, y: 760, width: 60, depth: 60 },
      { id: "leg-se", x: 1660, y: 760, width: 60, depth: 60 },
    ],
    rovingFocus: [{ key: "top", focusSelector: "#tabletop", label: "Tabletop" }],
    generatedAt: T + 20,
  },
  {
    id: id(),
    slug: "oando-eclipse-meeting-2400",
    sku: "OANDO-ECLIPSE-MTG-2400",
    geometry: { widthMm: 2400, depthMm: 1200, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 2400, height: 1200 },
    blocks: [
      { id: "tabletop", x: 0, y: 0, width: 2400, depth: 1200 },
      { id: "leg-nw", x: 100, y: 100, width: 70, depth: 70 },
      { id: "leg-ne", x: 2230, y: 100, width: 70, depth: 70 },
      { id: "leg-sw", x: 100, y: 1030, width: 70, depth: 70 },
      { id: "leg-se", x: 2230, y: 1030, width: 70, depth: 70 },
    ],
    generatedAt: T + 21,
  },
  {
    id: id(),
    slug: "oando-halo-meeting-3000",
    sku: "OANDO-HALO-MTG-3000",
    geometry: { widthMm: 3000, depthMm: 1200, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 3000, height: 1200 },
    blocks: [
      { id: "tabletop", x: 0, y: 0, width: 3000, depth: 1200 },
      { id: "leg-nw", x: 120, y: 120, width: 80, depth: 80 },
      { id: "leg-ne", x: 2800, y: 120, width: 80, depth: 80 },
      { id: "leg-sw", x: 120, y: 1000, width: 80, depth: 80 },
      { id: "leg-se", x: 2800, y: 1000, width: 80, depth: 80 },
    ],
    generatedAt: T + 22,
  },

  // ── 4 Storage ──
  {
    id: id(),
    slug: "oando-spino-low-cabinet-800",
    sku: "OANDO-SPINO-CAB-800",
    geometry: { widthMm: 800, depthMm: 450, heightMm: 900 },
    viewBox: { x: 0, y: 0, width: 800, height: 450 },
    blocks: [
      { id: "body", x: 0, y: 0, width: 800, depth: 450 },
      { id: "door-l", x: 20, y: 20, width: 360, depth: 410 },
      { id: "door-r", x: 420, y: 20, width: 360, depth: 410 },
    ],
    generatedAt: T + 30,
  },
  {
    id: id(),
    slug: "oando-spino-tall-cabinet-900",
    sku: "OANDO-SPINO-CAB-T900",
    geometry: { widthMm: 900, depthMm: 450, heightMm: 2100 },
    viewBox: { x: 0, y: 0, width: 900, height: 450 },
    blocks: [
      { id: "body", x: 0, y: 0, width: 900, depth: 450 },
      { id: "door-l", x: 20, y: 20, width: 410, depth: 410 },
      { id: "door-r", x: 470, y: 20, width: 410, depth: 410 },
    ],
    generatedAt: T + 31,
  },
  {
    id: id(),
    slug: "oando-omnia-storage-1200",
    sku: "OANDO-OMNIA-STG-1200",
    geometry: { widthMm: 1200, depthMm: 450, heightMm: 850 },
    viewBox: { x: 0, y: 0, width: 1200, height: 450 },
    blocks: [
      { id: "body", x: 0, y: 0, width: 1200, depth: 450 },
      { id: "door-1", x: 20, y: 20, width: 360, depth: 410 },
      { id: "door-2", x: 420, y: 20, width: 360, depth: 410 },
      { id: "door-3", x: 820, y: 20, width: 360, depth: 410 },
    ],
    generatedAt: T + 32,
  },
  {
    id: id(),
    slug: "oando-xmesh-locker-900",
    sku: "OANDO-XMESH-LCK-900",
    geometry: { widthMm: 900, depthMm: 450, heightMm: 1800 },
    viewBox: { x: 0, y: 0, width: 900, height: 450 },
    blocks: [
      { id: "body", x: 0, y: 0, width: 900, depth: 450 },
      { id: "door-1", x: 20, y: 20, width: 200, depth: 410 },
      { id: "door-2", x: 250, y: 20, width: 200, depth: 410 },
      { id: "door-3", x: 480, y: 20, width: 200, depth: 410 },
      { id: "door-4", x: 710, y: 20, width: 170, depth: 410 },
    ],
    generatedAt: T + 33,
  },

  // ── Pedestal ──
  {
    id: id(),
    slug: "oando-fluid-pedestal-400",
    sku: "OANDO-FLUID-PED-400",
    geometry: { widthMm: 400, depthMm: 560, heightMm: 720 },
    viewBox: { x: 0, y: 0, width: 400, height: 560 },
    blocks: [
      { id: "body", x: 0, y: 0, width: 400, depth: 560 },
      { id: "drawer-1", x: 20, y: 40, width: 360, depth: 140 },
      { id: "drawer-2", x: 20, y: 200, width: 360, depth: 140 },
      { id: "drawer-3", x: 20, y: 360, width: 360, depth: 140 },
    ],
    generatedAt: T + 40,
  },

  // ── Others (seating + collab — buyer still needs chairs) ──
  {
    id: id(),
    slug: "oando-breeze-task-chair",
    sku: "OANDO-BREEZE-CHR-TSK",
    geometry: { widthMm: 650, depthMm: 650, heightMm: 1100 },
    viewBox: { x: 0, y: 0, width: 650, height: 650 },
    blocks: [
      { id: "seat", x: 100, y: 140, width: 450, depth: 380 },
      { id: "backrest", x: 120, y: 40, width: 410, depth: 120 },
      { id: "base", x: 200, y: 500, width: 250, depth: 100 },
    ],
    generatedAt: T + 50,
  },
  {
    id: id(),
    slug: "oando-casca-guest-chair",
    sku: "OANDO-CASCA-CHR-GST",
    geometry: { widthMm: 600, depthMm: 600, heightMm: 900 },
    viewBox: { x: 0, y: 0, width: 600, height: 600 },
    blocks: [
      { id: "seat", x: 80, y: 160, width: 440, depth: 320 },
      { id: "backrest", x: 100, y: 40, width: 400, depth: 140 },
      { id: "legs", x: 120, y: 460, width: 360, depth: 80 },
    ],
    generatedAt: T + 51,
  },
  {
    id: id(),
    slug: "oando-mellow-sofa-2200",
    sku: "OANDO-MELLOW-SOF-2200",
    geometry: { widthMm: 2200, depthMm: 900, heightMm: 850 },
    viewBox: { x: 0, y: 0, width: 2200, height: 900 },
    blocks: [
      { id: "seat", x: 80, y: 160, width: 2040, depth: 620 },
      { id: "backrest", x: 80, y: 40, width: 2040, depth: 140 },
      { id: "arm-l", x: 40, y: 160, width: 80, depth: 620 },
      { id: "arm-r", x: 2080, y: 160, width: 80, depth: 620 },
    ],
    generatedAt: T + 52,
  },
  {
    id: id(),
    slug: "oando-cafe-discussion-table-900",
    sku: "OANDO-CAFE-TBL-900",
    geometry: { widthMm: 900, depthMm: 900, heightMm: 750 },
    viewBox: { x: 0, y: 0, width: 900, height: 900 },
    blocks: [
      { id: "tabletop", x: 80, y: 80, width: 740, depth: 740 },
      { id: "base", x: 350, y: 350, width: 200, depth: 200 },
    ],
    generatedAt: T + 53,
  },

  // Internal only
  {
    id: id(),
    slug: "missing-geom-fallback-001",
    sku: "OFL-FBK-001",
    geometry: { widthMm: 200, depthMm: 200, heightMm: 200 },
    viewBox: { x: 0, y: 0, width: 200, height: 200 },
    blocks: [{ id: "fallback-body", x: 20, y: 20, width: 160, depth: 160 }],
    generatedAt: T + 99,
    internal: true,
  },
];

function buildDescriptor(seed: SeedInput) {
  const base = {
    schemaVersion: "2026-07-04.v2" as const,
    id: seed.id,
    slug: seed.slug,
    sku: seed.sku,
    sourceProvenance: "native" as const,
    createdBy: "seed-block-descriptors-brand-heroes",
    geometry: seed.geometry,
    viewBox: seed.viewBox,
    mounting: ["floor"] as const,
    themeTokens: {
      // Schema-legal keys/values only (currentColor | --kebab; no #hex).
      // Pipeline resolves image-safe greys at paint time.
      currentColor: "currentColor",
      "--fill-primary": "var(--color-surface-raised)",
      "--stroke-accent": "var(--color-border)",
    },
    rovingFocus: seed.rovingFocus ?? [],
    liveAnnouncementCategories: ["status"] as const,
    variant: "fixed" as const,
    fixed: { sizingType: "fixed" as const },
    checksum: "0".repeat(64),
    generatedAt: seed.generatedAt,
    ...(seed.blocks && seed.blocks.length > 0 ? { blocks: seed.blocks } : {}),
    ...(seed.maker ? { maker: seed.maker } : {}),
  };

  const frozen = freezeFreshDescriptor(base, () => seed.generatedAt);
  if (frozen.ok === false) {
    throw new Error(`Failed to freeze ${seed.slug}: ${frozen.error.message}`);
  }
  return frozen.value;
}

function main(): void {
  const dir = resolveBlockDescriptorsDir();
  mkdirSync(dir, { recursive: true });

  const buyer = SEEDS.filter((s) => !s.internal);
  console.log(
    `Buyer heroes: desks=5 ws=5 meeting=3 storage=4 pedestal=1 others=4 (total ${buyer.length})`,
  );

  const keep = new Set(SEEDS.map((s) => s.slug));
  for (const seed of SEEDS) {
    const descriptor = buildDescriptor(seed);
    const outPath = path.join(dir, `${descriptor.slug}.json`);
    writeFileSync(outPath, `${JSON.stringify(descriptor, null, 2)}\n`, "utf8");
    console.log(`wrote ${outPath}${seed.internal ? " (internal)" : ""}`);
  }

  // Remove legacy generic OFL descriptors so buyer inventory is brand heroes only.
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    if (entry.includes(".latest.") || /\.\d+\.json$/.test(entry)) {
      // versioned history of retired slugs — leave or delete base only
      const base = entry.replace(/\.latest\.json$/, ".json").replace(/\.\d+\.json$/, ".json");
      const baseSlug = base.replace(/\.json$/, "");
      if (!keep.has(baseSlug) && !entry.startsWith("_")) {
        try {
          unlinkSync(path.join(dir, entry));
          console.log(`removed legacy ${entry}`);
        } catch {
          /* ignore */
        }
      }
      continue;
    }
    const slug = entry.slice(0, -".json".length);
    if (!keep.has(slug) && !slug.startsWith("_")) {
      unlinkSync(path.join(dir, entry));
      console.log(`removed legacy ${entry}`);
    }
  }

  // B13: drop retired OFL plan SVGs that conflict with the brand set.
  // Keep: seed slugs, sample-* demo art, demo/systems residuals still referenced in code.
  const svgKeepExtra = new Set([
    "cabinet-v0",
    "workstation-linear",
    "desk-linear-1200-001", // Failures.md dual-write proof residual
    "side-table-001", // admin e2e residual
    "chaise-lounge-001", // open3d e2e residual
  ]);
  const svgDir = path.join(resolvePublicDir(), "assets", "others", "legacy", "svg-catalog");
  try {
    for (const entry of readdirSync(svgDir)) {
      if (!entry.endsWith(".svg")) continue;
      const slug = entry.slice(0, -".svg".length);
      if (keep.has(slug)) continue;
      if (slug.startsWith("sample-")) continue;
      if (slug.startsWith("_")) continue;
      if (svgKeepExtra.has(slug)) continue;
      unlinkSync(path.join(svgDir, entry));
      console.log(`removed legacy svg ${entry}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`svg-catalog cleanup skipped: ${message}`);
  }

  clearLoaderCache();
  const loaded = loadAll({ forceReload: true });
  const loadedSlugs = new Set(loaded.map((d) => d.slug));
  const missing = SEEDS.filter((s) => !loadedSlugs.has(s.slug));
  console.log(`loadAll: ${loaded.length}; seeds=${SEEDS.length}`);
  if (missing.length > 0) {
    console.error("missing:", missing.map((s) => s.slug).join(", "));
    process.exitCode = 1;
  }
}

main();
