import { promises as fs } from "node:fs";
import path from "node:path";

const famMap = {
  seating: "seating",
  workstations: "workstations",
  tables: "tables",
  storage: "storage",
  "soft-seating": "soft-seating",
  educational: "educational",
  collaborative: "collaborative",
};

function nest(s) {
  return s.replace(
    /\/assets\/catalog\/(oando-([a-z0-9-]+)--[^/"'\s]+)/gi,
    (m, folder, f) => {
      if (/\/catalog\/(seating|workstations|tables|storage|soft-seating|educational|collaborative)\//i.test(m)) {
        return m;
      }
      const family = famMap[f.toLowerCase()];
      if (!family) return m;
      return `/assets/catalog/${family}/${folder}`;
    },
  );
}

async function walk(dir, acc = []) {
  let ents;
  try {
    ents = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (/\.(ts|tsx|json)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const roots = [
  "site/features/site/data",
  "site/i18n/messages",
  "site/components",
  "tests/unit/lib",
];
let n = 0;
for (const r of roots) {
  for (const f of await walk(r)) {
    const t = await fs.readFile(f, "utf8");
    const u = nest(t);
    if (u !== t) {
      await fs.writeFile(f, u);
      n++;
      console.log("updated", f);
    }
  }
}
console.log("files", n);
