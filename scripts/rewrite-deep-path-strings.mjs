import { promises as fs } from "node:fs";
import path from "node:path";

function rewrite(s) {
  s = s.replace(
    /\/assets\/catalog\/flagship\/(?!categories\/)([A-Za-z0-9._-]+)/g,
    "/assets/catalog/flagship/categories/$1",
  );
  s = s.replace(
    /\/assets\/marketing\/fallback\/(?!placeholders\/)([A-Za-z0-9._-]+)/g,
    "/assets/marketing/fallback/placeholders/$1",
  );
  s = s.replace(
    /\/assets\/marketing\/client-logos\/([A-Za-z0-9._-]+)\.(webp|png|jpe?g)/gi,
    "/assets/marketing/client-logos/$1/$1.$2",
  );
  s = s.replace(
    /\/assets\/marketing\/hero\/(home-poster\.webp|hero-[0-9]+\.webp|hero copy\.webp)/g,
    "/assets/marketing/hero/slides/$1",
  );
  s = s.replace(
    /\/assets\/marketing\/hero\/(titan[^"'/\s]*|tvs[^"'/\s]*|dmrc[^"'/\s]*|usha[^"'/\s]*|franklin[^"'/\s]*)/gi,
    "/assets/marketing/hero/installs/$1",
  );
  s = s.replace(
    /\/assets\/marketing\/hero\/([A-Za-z0-9._-]*poster[A-Za-z0-9._-]*\.webp)/gi,
    "/assets/marketing/hero/pages/$1",
  );
  s = s.replace(
    /\/assets\/marketing\/hero\/(about-story|chairs|educational|workstations)\.webp/gi,
    "/assets/marketing/hero/pages/$1.webp",
  );
  s = s.replace(
    /(\/assets\/catalog\/(?:seating|workstations|tables|storage|soft-seating|educational|collaborative)\/[^/"']+)\/(image-[0-9]+\.(?:webp|jpe?g))/gi,
    (m, sku, file) => {
      if (m.includes("/gallery/")) return m;
      return `${sku}/gallery/${file}`;
    },
  );
  return s;
}

async function walk(d, a = []) {
  let ents;
  try {
    ents = await fs.readdir(d, { withFileTypes: true });
  } catch {
    return a;
  }
  for (const e of ents) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) await walk(p, a);
    else if (/\.(ts|tsx|json)$/.test(e.name)) a.push(p);
  }
  return a;
}

let n = 0;
for (const root of [
  "site/features/site/data",
  "site/i18n/messages",
  "site/components",
  "tests/unit",
]) {
  for (const f of await walk(root)) {
    const t = await fs.readFile(f, "utf8");
    const u = rewrite(t);
    if (u !== t) {
      await fs.writeFile(f, u);
      n++;
      console.log(f);
    }
  }
}
console.log("updated", n);
