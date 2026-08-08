import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

const CATALOG = path.resolve("site/public/assets/catalog");
const INBOX = path.join(CATALOG, "_inbox");
const FAMILIES = ["seating","workstations","tables","storage","soft-seating","educational","collaborative"];

async function _walkDirs(root) {
  const out = [];
  async function w(d) {
    let ents;
    try { ents = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        out.push(full);
        await w(full);
      }
    }
  }
  await w(root);
  return out;
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha1");
    createReadStream(file).on("data", (c) => h.update(c)).on("end", () => resolve(h.digest("hex"))).on("error", reject);
  });
}

function slugHints(dirName) {
  // oando-seating--fluid-x -> [fluid-x, fluidx, seating]
  const m = dirName.match(/^oando-([a-z0-9-]+)--(.+)$/i);
  if (!m) return [dirName.toLowerCase()];
  const slug = m[2].toLowerCase();
  return [slug, slug.replace(/-/g, ""), m[1].toLowerCase()];
}

async function main() {
  // index product dirs: slug hint -> dir path
  const productDirs = [];
  for (const fam of FAMILIES) {
    const famDir = path.join(CATALOG, fam);
    let ents = [];
    try { ents = await fs.readdir(famDir, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      if (!e.isDirectory()) continue;
      if (e.name.startsWith("_")) continue;
      productDirs.push({ fam, name: e.name, path: path.join(famDir, e.name), hints: slugHints(e.name) });
    }
  }

  const files = (await fs.readdir(INBOX)).filter((n) => !n.startsWith("."));
  let moved = 0, unmatched = 0;
  const report = { moved: [], unmatched: [] };

  for (const name of files) {
    const from = path.join(INBOX, name);
    const st = await fs.stat(from);
    if (!st.isFile()) continue;
    const lower = name.toLowerCase();
    // strip cms prefix hash chunks — look for product tokens
    let best = null;
    let bestScore = 0;
    for (const p of productDirs) {
      let score = 0;
      for (const h of p.hints) {
        if (h.length >= 3 && lower.includes(h)) score = Math.max(score, h.length);
      }
      // filename tokens after last underscore often product name
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (best && bestScore >= 4) {
      const to = path.join(best.path, name);
      try {
        await fs.rename(from, to);
        moved++;
        report.moved.push({ name, to: path.relative(CATALOG, to) });
      } catch (e) {
        // exists — compare hash
        try {
          const h1 = await hashFile(from);
          const h2 = await hashFile(to);
          if (h1 === h2) {
            await fs.unlink(from);
            moved++;
            report.moved.push({ name, to: path.relative(CATALOG, to), deduped: true });
          } else {
            unmatched++;
            report.unmatched.push({ name, reason: "dest exists different hash", best: best.name });
          }
        } catch {
          unmatched++;
          report.unmatched.push({ name, reason: String(e.message || e) });
        }
      }
    } else {
      unmatched++;
      report.unmatched.push({ name, reason: "no slug match" });
    }
  }

  const left = (await fs.readdir(INBOX)).filter((n) => n !== ".gitkeep");
  await fs.writeFile(
    "results/asset-cutover/inbox-drain-report.json",
    JSON.stringify({ moved, unmatched, left: left.length, sampleUnmatched: report.unmatched.slice(0, 40), sampleMoved: report.moved.slice(0, 20) }, null, 2),
  );
  console.log({ moved, unmatched, left: left.length });
}

main().catch((e) => { console.error(e); process.exit(1); });
