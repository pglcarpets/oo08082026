import { promises as fs } from "fs";
import path from "path";

function fix(s) {
  return s.replace(
    /\/assets\/marketing\/client-logos\/([^/"']+)\/\1\.(webp|png|jpe?g)/gi,
    "/assets/marketing/client-logos/$1.$2",
  );
}

async function walk(d, a = []) {
  for (const e of await fs.readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p, a);
    else if (/\.(ts|tsx|json)$/.test(e.name)) a.push(p);
  }
  return a;
}

let n = 0;
for (const root of ["site/features", "site/i18n/messages", "tests"]) {
  for (const f of await walk(root)) {
    const t = await fs.readFile(f, "utf8");
    const u = fix(t);
    if (u !== t) {
      await fs.writeFile(f, u);
      n++;
      console.log(f);
    }
  }
}
console.log("updated", n);
