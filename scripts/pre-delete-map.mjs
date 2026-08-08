import { promises as fs } from "fs";
import path from "path";

const ROOT = path.resolve("site/public/assets");
const MAJORS = ["marketing", "catalog", "planner", "studio", "others"];

async function walkStats(dir) {
  let files = 0;
  let bytes = 0;
  let dirs = 0;
  async function w(d) {
    let ents;
    try {
      ents = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        dirs++;
        await w(p);
      } else {
        files++;
        try {
          bytes += (await fs.stat(p)).size;
        } catch {
          /* skip */
        }
      }
    }
  }
  await w(dir);
  return { files, bytes, dirs };
}

async function listChildren(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function mb(n) {
  return Math.round((n / 1024 / 1024) * 10) / 10;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const majors = {};
  const rows = [];

  for (const m of MAJORS) {
    const majorPath = path.join(ROOT, m);
    const top = await walkStats(majorPath);
    const children = [];
    for (const e of await listChildren(majorPath)) {
      if (!e.isDirectory()) continue;
      const p = path.join(majorPath, e.name);
      const st = await walkStats(p);
      children.push({
        name: e.name,
        files: st.files,
        dirs: st.dirs,
        mb: mb(st.bytes),
        bytes: st.bytes,
      });
    }
    children.sort((a, b) => b.bytes - a.bytes);
    majors[m] = {
      files: top.files,
      dirs: top.dirs,
      mb: mb(top.bytes),
      bytes: top.bytes,
      children,
    };
    rows.push({ major: m, ...majors[m] });
  }

  // deeper sample: catalog families + marketing key
  const deep = {};
  for (const fam of [
    "seating",
    "workstations",
    "tables",
    "storage",
    "soft-seating",
    "educational",
    "collaborative",
    "products",
    "flagship",
  ]) {
    const p = path.join(ROOT, "catalog", fam);
    if (
      await fs
        .stat(p)
        .then(() => true)
        .catch(() => false)
    ) {
      const st = await walkStats(p);
      const skus = (await listChildren(p)).filter((e) => e.isDirectory()).map((e) => e.name);
      deep[`catalog/${fam}`] = {
        files: st.files,
        mb: mb(st.bytes),
        subfolderCount: skus.length,
        subfoldersSample: skus.slice(0, 15),
      };
    }
  }

  // safe-to-delete candidates (list only — no delete)
  const safeHints = [];
  async function findNamed(dir, name, relBase) {
    let ents;
    try {
      ents = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of ents) {
      const p = path.join(dir, e.name);
      const rel = path.relative(ROOT, p).split(path.sep).join("/");
      if (e.isDirectory()) {
        if (
          e.name === "_originals" ||
          e.name === "_quarantine" ||
          e.name === "legacy-flat" ||
          e.name === "_cms-orphan" ||
          e.name === "_legacy-chairs" ||
          e.name.startsWith("_legacy")
        ) {
          const st = await walkStats(p);
          safeHints.push({
            path: rel,
            files: st.files,
            mb: mb(st.bytes),
            hint: "likely safe to delete if you do not need originals/legacy",
          });
        }
        if (e.name !== "node_modules") await findNamed(p, name, relBase);
      }
    }
  }
  await findNamed(ROOT, "", "");

  const totalFiles = rows.reduce((s, r) => s + r.files, 0);
  const totalMb = rows.reduce((s, r) => s + r.mb, 0);

  const json = {
    generatedAt,
    purpose: "Pre-delete map — review before deleting anything",
    root: ROOT,
    majors,
    catalogDeep: deep,
    likelySafeDeleteCandidates: safeHints.sort((a, b) => b.mb - a.mb),
    totals: { files: totalFiles, mb: Math.round(totalMb * 10) / 10 },
  };

  await fs.mkdir("results/asset-cutover", { recursive: true });
  await fs.writeFile(
    "results/asset-cutover/PRE-DELETE-MAP.json",
    JSON.stringify(json, null, 2),
  );

  const md = [
    "# Pre-delete map (read-only)",
    "",
    `**Generated:** ${generatedAt}`,
    "",
    "Review this **before** deleting. No files were deleted by this step.",
    "",
    "## Totals",
    "",
    `| Major | Files | MB | Top-level subfolders |`,
    `|-------|------:|---:|---------------------:|`,
    ...rows.map(
      (r) =>
        `| **${r.major}** | ${r.files} | ${r.mb} | ${r.children.length} |`,
    ),
    `| **TOTAL** | ${totalFiles} | ${Math.round(totalMb * 10) / 10} | |`,
    "",
    "## Per major — subfolders (by size)",
    "",
  ];

  for (const m of MAJORS) {
    md.push(`### ${m}/`, "");
    md.push(`| Subfolder | Files | MB |`, `|----------|------:|---:|`);
    for (const c of majors[m].children) {
      md.push(`| \`${c.name}/\` | ${c.files} | ${c.mb} |`);
    }
    md.push("");
  }

  md.push("## Catalog families (deeper)", "");
  md.push(`| Path | Files | MB | Subfolders |`, `|------|------:|---:|----------:|`);
  for (const [k, v] of Object.entries(deep)) {
    md.push(`| \`${k}/\` | ${v.files} | ${v.mb} | ${v.subfolderCount} |`);
  }
  md.push("");

  md.push("## Likely safe to delete (candidates only)", "");
  md.push(
    "Paths named `_originals`, `_quarantine`, `legacy-flat`, `_legacy*`, `_cms-orphan`.",
    "",
    "| Path | Files | MB |",
    "|------|------:|---:|",
  );
  for (const s of safeHints.slice(0, 40)) {
    md.push(`| \`${s.path}\` | ${s.files} | ${s.mb} |`);
  }
  if (safeHints.length === 0) md.push("| (none found) | | |");
  md.push(
    "",
    "## Do not delete without checking",
    "",
    "- `catalog/*/oando-*/gallery/image-1.webp` (sole product still)",
    "- `marketing/hero/**`, `marketing/client-logos/**` you still use",
    "- `catalog/flagship/**`",
    "- Entire family folders",
    "",
    "Full JSON: `PRE-DELETE-MAP.json`",
    "",
  );

  await fs.writeFile("results/asset-cutover/PRE-DELETE-MAP.md", md.join("\n"));
  console.log(
    JSON.stringify(
      {
        totals: json.totals,
        safeCandidates: safeHints.length,
        out: ["results/asset-cutover/PRE-DELETE-MAP.md", "results/asset-cutover/PRE-DELETE-MAP.json"],
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
