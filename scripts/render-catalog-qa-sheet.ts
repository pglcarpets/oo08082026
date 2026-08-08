/**
 * Full catalog SVG visual QA — all PLANNER_CATALOG_ITEMS at 2rem + detail sheet.
 * Run: npx tsx scripts/render-catalog-qa-sheet.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLANNER_CATALOG_ITEMS } from "../site/lib/catalog/workspaceCatalog";
import type { WorkspaceCatalogItem } from "../site/lib/catalog/workspaceCatalog";
import { blockToSvg, type Block2D } from "../site/lib/catalog/blocks2d";
import { loadBlockCss, rasterizeSvg, RASTER_BG, styleTag } from "./blockRenderUtils";

/** Minimal rect block from residual workspace catalog dimensions. */
function resolveCatalogItemBlock2D(item: WorkspaceCatalogItem): Block2D | null {
  const L = item.widthMm ?? 0;
  const D = item.depthMm ?? 0;
  if (L <= 0 || D <= 0) return null;
  return {
    footprint: { L, D },
    label: item.name,
    prims: [
      {
        kind: "rect",
        x: 0,
        y: 0,
        w: L,
        h: D,
        fill: "var(--block-surface)",
        stroke: "var(--block-surface-stroke)",
      },
    ],
  };
}

type CatalogItem = WorkspaceCatalogItem;

const REPO = resolve(__dirname, "../..");
const OUT = resolve(REPO, "results/catalog-qa");
const PAD = 480;
const THUMB_W = 48;
const THUMB_H = 48;
const COLS = 8;
const CELL_W = 200;
const CELL_H = 88;
const GAP = 12;

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function parseBlockSvg(block: Block2D, css: string): { viewBox: string; inner: string } {
  const raw = blockToSvg(block, undefined, css);
  const viewBox = raw.match(/viewBox="([^"]+)"/)?.[1] ?? `0 0 ${block.footprint.L} ${block.footprint.D}`;
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>\s*/i, "").replace(/\s*<\/svg>\s*$/i, "");
  return { viewBox, inner };
}

function shortName(name: string, max = 42): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

type QaEntry = {
  item: CatalogItem;
  block: Block2D;
  parsed: ReturnType<typeof parseBlockSvg>;
};

function collectEntries(css: string): { entries: QaEntry[]; failures: string[] } {
  const entries: QaEntry[] = [];
  const failures: string[] = [];

  for (const item of PLANNER_CATALOG_ITEMS) {
    const block = resolveCatalogItemBlock2D(item);
    if (!block) {
      failures.push(`${item.id}: no block`);
      continue;
    }
    if (block.footprint.L <= 0 || block.footprint.D <= 0) {
      failures.push(`${item.id}: invalid footprint`);
      continue;
    }
    if (block.prims.length === 0) {
      failures.push(`${item.id}: empty primitives`);
      continue;
    }
    const svg = blockToSvg(block, undefined, css);
    if (!svg.includes("<svg") || /data:image|\.png|\.jpe?g/i.test(svg)) {
      failures.push(`${item.id}: bad svg`);
      continue;
    }
    entries.push({ item, block, parsed: parseBlockSvg(block, css) });
  }

  return { entries, failures };
}

function buildThumbGridSheet(css: string, entries: QaEntry[]): string {
  const rows = Math.ceil(entries.length / COLS);
  const sheetW = COLS * CELL_W + GAP;
  const sheetH = rows * CELL_H + GAP;

  const cells: string[] = [];
  entries.forEach((entry, index) => {
    const col = index % COLS;
    const row = Math.floor(index / COLS);
    const x = GAP / 2 + col * CELL_W;
    const y = GAP / 2 + row * CELL_H;
    const { item, block, parsed } = entry;

    cells.push(
      `<g transform="translate(${x},${y})">`,
      `<rect width="${CELL_W - 8}" height="${CELL_H - 8}" fill="var(--color-white-50)" stroke="var(--text-inverse-body)" stroke-width="1" rx="4"/>`,
      `<svg x="12" y="8" width="${THUMB_W}" height="${THUMB_H}" viewBox="${parsed.viewBox}" preserveAspectRatio="xMidYMid meet">`,
      parsed.inner,
      `</svg>`,
      `<text x="68" y="22" font-family="system-ui,sans-serif" font-size="9" font-weight="600" fill="var(--text-body)">${escapeXml(shortName(item.name, 22))}</text>`,
      `<text x="68" y="36" font-family="system-ui,sans-serif" font-size="8" fill="var(--text-subtle)">${block.footprint.L}×${block.footprint.D} · ${block.prims.length}p</text>`,
      `<text x="68" y="50" font-family="system-ui,sans-serif" font-size="7" fill="var(--text-inverse-subtle)">${escapeXml(item.category)}</text>`,
      `</g>`,
    );
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetW}" height="${sheetH}" viewBox="0 0 ${sheetW} ${sheetH}" shape-rendering="geometricPrecision">`,
    styleTag(css),
    `<rect width="100%" height="100%" fill="${RASTER_BG}"/>`,
    `<text x="${GAP}" y="0" font-family="system-ui,sans-serif" font-size="11" fill="var(--text-subtle)">${THUMB_W}px thumbnails · ${entries.length} items</text>`,
    ...cells,
    `</svg>`,
  ].join("\n");
}

function buildDetailSheet(css: string, entries: QaEntry[]): string {
  const colW = 1100;
  let y = 24;
  const rows: string[] = [];

  let lastCategory = "";
  for (const { item, block, parsed } of entries) {
    if (item.category !== lastCategory) {
      lastCategory = item.category;
      rows.push(
        `<text x="16" y="${y + 16}" font-family="system-ui,sans-serif" font-size="14" font-weight="700" fill="var(--text-heading-soft)">${escapeXml(item.category)}</text>`,
      );
      y += 28;
    }

    const displayH = Math.min(280, Math.max(80, (block.footprint.D + PAD * 2) / 5));
    const rowH = displayH + 56;
    rows.push(
      `<g transform="translate(16, ${y})">`,
      `<text x="0" y="14" font-family="system-ui,sans-serif" font-size="11" font-weight="600" fill="var(--text-body)">${escapeXml(shortName(item.name, 70))}</text>`,
      `<text x="0" y="28" font-family="system-ui,sans-serif" font-size="9" fill="var(--text-subtle)">${block.footprint.L}×${block.footprint.D} mm · ${block.prims.length} primitives</text>`,
      `<svg x="0" y="36" width="${colW - 32}" height="${displayH}" viewBox="${parsed.viewBox}" preserveAspectRatio="xMidYMid meet">`,
      parsed.inner,
      `</svg>`,
      `</g>`,
    );
    y += rowH + 16;
  }

  const sheetH = y + 24;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${colW}" height="${sheetH}" viewBox="0 0 ${colW} ${sheetH}" shape-rendering="geometricPrecision">`,
    styleTag(css),
    `<rect width="100%" height="100%" fill="${RASTER_BG}"/>`,
    ...rows,
    `</svg>`,
  ].join("\n");
}

const DETAIL_PAGE_SIZE = 18;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

function categorySlug(category: string): string {
  return category.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function groupByCategory(entries: QaEntry[]): Map<string, QaEntry[]> {
  const map = new Map<string, QaEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.item.category) ?? [];
    list.push(entry);
    map.set(entry.item.category, list);
  }
  return map;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const css = loadBlockCss();
  const { entries, failures } = collectEntries(css);

  writeFileSync(resolve(OUT, "failures.json"), JSON.stringify({ count: failures.length, failures }, null, 2));

  const thumbSvg = buildThumbGridSheet(css, entries);
  const detailSvg = buildDetailSheet(css, entries);

  writeFileSync(resolve(OUT, "catalog-qa-32px.svg"), thumbSvg);
  writeFileSync(resolve(OUT, "catalog-qa-detail.svg"), detailSvg);
  writeFileSync(resolve(REPO, "results/actual_engine_blocks.svg"), detailSvg);

  await rasterizeSvg(thumbSvg, resolve(OUT, "catalog-qa-32px.png"), 2400, css);

  const byCategory = groupByCategory(entries);
  const detailOutputs: string[] = [];
  for (const [category, categoryEntries] of byCategory) {
    const slug = categorySlug(category);
    const pages = chunk(categoryEntries, DETAIL_PAGE_SIZE);
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const suffix = pages.length > 1 ? `-${String(pageIndex + 1).padStart(2, "0")}` : "";
      const pageSvg = buildDetailSheet(css, pages[pageIndex]);
      const base = `catalog-qa-detail-${slug}${suffix}`;
      writeFileSync(resolve(OUT, `${base}.svg`), pageSvg);
      await rasterizeSvg(pageSvg, resolve(OUT, `${base}.png`), 1920, css);
      detailOutputs.push(`${base}.png`);
    }
  }

  console.log(`catalog items: ${PLANNER_CATALOG_ITEMS.length}`);
  console.log(`rendered: ${entries.length}`);
  console.log(`categories: ${byCategory.size}`);
  console.log(`failures: ${failures.length}`);
  if (failures.length) {
    console.log(failures.slice(0, 10).join("\n"));
    process.exit(1);
  }
  console.log(`wrote ${OUT}/catalog-qa-32px.png`);
  for (const file of detailOutputs) {
    console.log(`wrote ${OUT}/${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
