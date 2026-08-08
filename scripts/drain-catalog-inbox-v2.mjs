/**
 * Drain catalog/_inbox with CMS-style names:
 * 686d…_6899…_product_token_1.webp
 */
import { createHash } from "node:crypto";
import { createReadStream, promises as fs } from "node:fs";
import path from "node:path";

const CATALOG = path.resolve("site/public/assets/catalog");
const INBOX = path.join(CATALOG, "_inbox");
const FAMILIES = [
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
];

// manual token → relative product dir under catalog/
const ALIASES = {
  x_mesh: "seating/oando-seating--x-mesh",
  xmesh: "seating/oando-seating--x-mesh",
  trio: "workstations/oando-workstations--trio-2",
  trio_2: "workstations/oando-workstations--trio-2",
  rio: "seating/oando-seating--rio",
  wing: "seating/_legacy-chairs", // if no wing sku
  side_unit: "storage/_legacy-storage",
  filing_cabinet: "storage/_legacy-storage",
  racks: "storage/oando-storage--heavy-duty-racks",
  metal_locker: "storage/oando-storage--metal-locker",
  metal_pedestal: "storage/oando-storage--metal-pedestal",
  pedestal: "storage/oando-storage--pedestal",
  panelpro: "workstations/oando-workstations--panel-pro",
  panel_pro: "workstations/oando-workstations--panel-pro",
  curvivo: "workstations/oando-workstations--curvivo",
  deskpro: "workstations/oando-workstations--deskpro",
  sleek: "workstations/oando-workstations--sleek",
  consulate: "tables/oando-tables--consulate",
  presidency: "tables/oando-tables--presidency",
  apex: "tables/oando-tables--apex",
  logica: "seating/oando-seating--logica",
  flex: "seating/oando-seating--flex",
  fenix: "workstations/oando-workstations--fenix",
  x_bench: "workstations/oando-workstations--x-bench",
  xbench: "workstations/oando-workstations--x-bench",
  hat: "storage/_legacy-storage",
  grace: "seating/oando-seating--grace",
  pinnacle: "seating/oando-seating--pinnacle",
  moonlight: "seating/oando-seating--moonlight",
  rider: "seating/oando-seating--rider",
  arvo: "seating/oando-seating--arvo",
  caneva: "seating/oando-seating--caneva",
  caneva_h: "seating/oando-seating--caneva-high",
  brim: "seating/oando-seating--brim",
  copse: "seating/oando-seating--copse",
  lexus: "seating/oando-seating--lexus",
  fynn: "seating/oando-seating--fynn",
  verka: "soft-seating/oando-soft-seating--verka",
  opus: "tables/oando-tables--opus-2",
  adaptable: "workstations/oando-workstations--adaptable",
  exquisite: "tables/oando-tables--exquisite",
};

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha1");
    createReadStream(file)
      .on("data", (c) => h.update(c))
      .on("end", () => resolve(h.digest("hex")))
      .on("error", reject);
  });
}

function extractTokens(filename) {
  const base = filename.replace(/\.[^.]+$/, "").toLowerCase();
  // drop leading hex chunks
  const parts = base.split("_").filter(Boolean);
  const meaningful = [];
  for (const p of parts) {
    if (/^[a-f0-9]{8,}$/i.test(p)) continue;
    if (/^image[-_]?\d+$/i.test(p)) continue;
    if (/^\d+$/.test(p)) continue;
    meaningful.push(p);
  }
  const tokens = [...meaningful];
  // one pair-join only (side + unit → side_unit), fixed length
  for (let i = 0; i < meaningful.length - 1; i++) {
    tokens.push(`${meaningful[i]}_${meaningful[i + 1]}`);
  }
  if (meaningful.length) {
    tokens.push(meaningful.join("_"));
    tokens.push(meaningful.join("-"));
  }
  return [...new Set(tokens)].filter((t) => t.length >= 2 && t.length < 80);
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  // build slug index from disk
  const slugIndex = [];
  for (const fam of FAMILIES) {
    const famDir = path.join(CATALOG, fam);
    let ents = [];
    try {
      ents = await fs.readdir(famDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of ents) {
      if (!e.isDirectory() || e.name.startsWith("_")) continue;
      const slug = e.name.includes("--")
        ? e.name.split("--").pop().toLowerCase()
        : e.name.toLowerCase();
      slugIndex.push({
        path: path.join(famDir, e.name),
        rel: `${fam}/${e.name}`,
        slug,
        slugFlat: slug.replace(/-/g, ""),
      });
    }
  }

  const files = (await fs.readdir(INBOX)).filter((n) => n !== ".gitkeep");
  let moved = 0;
  let unmatched = 0;
  const report = { moved: [], unmatched: [] };

  for (const name of files) {
    const from = path.join(INBOX, name);
    const st = await fs.stat(from);
    if (!st.isFile()) continue;

    const tokens = extractTokens(name);
    let destRel = null;

    for (const t of tokens) {
      if (ALIASES[t]) {
        destRel = ALIASES[t];
        break;
      }
      const tFlat = t.replace(/_/g, "-");
      const tNo = t.replace(/[_-]/g, "");
      const hit = slugIndex.find(
        (s) => s.slug === tFlat || s.slugFlat === tNo || s.slug.includes(tFlat),
      );
      if (hit && tFlat.length >= 3) {
        destRel = hit.rel;
        break;
      }
    }

    // pure image_NNNN with no product token → keep unmatched
    if (!destRel) {
      unmatched++;
      report.unmatched.push({ name, tokens });
      continue;
    }

    const destDir = path.join(CATALOG, destRel);
    await ensureDir(destDir);
    // clean filename: last meaningful part
    const clean = name.replace(/^[a-f0-9]{20,}_[a-f0-9]{10,}_/i, "");
    const to = path.join(destDir, clean);
    try {
      if (
        await fs
          .access(to)
          .then(() => true)
          .catch(() => false)
      ) {
        const h1 = await hashFile(from);
        const h2 = await hashFile(to);
        if (h1 === h2) {
          await fs.unlink(from);
          moved++;
          report.moved.push({ name, to: path.relative(CATALOG, to), deduped: true });
          continue;
        }
        // different content — keep unique suffix
        const alt = path.join(destDir, `inbox-${clean}`);
        await fs.rename(from, alt);
        moved++;
        report.moved.push({ name, to: path.relative(CATALOG, alt) });
        continue;
      }
      await fs.rename(from, to);
      moved++;
      report.moved.push({ name, to: path.relative(CATALOG, to) });
    } catch (e) {
      unmatched++;
      report.unmatched.push({ name, error: String(e.message || e) });
    }
  }

  const left = (await fs.readdir(INBOX)).filter((n) => n !== ".gitkeep");
  await fs.writeFile(
    "results/asset-cutover/inbox-drain-v2-report.json",
    JSON.stringify(
      {
        moved,
        unmatched,
        left: left.length,
        leftNames: left,
        sampleMoved: report.moved.slice(0, 30),
        sampleUnmatched: report.unmatched.slice(0, 40),
      },
      null,
      2,
    ),
  );
  console.log({ moved, unmatched, left: left.length });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
