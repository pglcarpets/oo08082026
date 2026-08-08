/**
 * Check Supabase product/furniture image refs against local disk + storage.
 * Usage: pnpm exec node scripts/check-supabase-missing-images.mjs
 */
import { config } from "dotenv";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const adminUrl =
  process.env.NEXT_ADMIN_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
const adminKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim();
const adminSb = adminUrl && adminKey
  ? createClient(adminUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const assetsRoot = resolve(process.cwd(), "site/public");

const FAMILY_PREFIX = [
  "seating",
  "workstations",
  "tables",
  "storage",
  "soft-seating",
  "educational",
  "collaborative",
];

/** Candidate on-disk paths for a public URL (legacy /images + nested gallery). */
function candidateWebPaths(webPath) {
  let p = webPath.trim().split("?")[0];
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      p = new URL(p).pathname;
    } catch {
      return [];
    }
  }
  const out = new Set();
  const add = (x) => {
    if (x) out.add(x);
  };
  add(p);
  // /images → /assets (cutover)
  if (p.startsWith("/images/")) {
    add(p.replace(/^\/images\//, "/assets/"));
  }
  // prefer webp siblings
  for (const cur of out) {
    if (/\.(jpe?g|png)$/i.test(cur)) {
      add(cur.replace(/\.(jpe?g|png)$/i, ".webp"));
    }
  }
  // nest oando-{family}--slug under family/gallery
  for (const cur of out) {
    const m = cur.match(
      /^\/assets\/catalog\/(oando-([a-z0-9-]+)--[^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (m) {
      const sku = m[1];
      const famHint = m[2];
      const file = m[3];
      const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
      const families = FAMILY_PREFIX.includes(famHint)
        ? [famHint]
        : FAMILY_PREFIX;
      for (const fam of families) {
        if (!sku.startsWith(`oando-${fam}--`) && fam !== famHint) continue;
        add(`/assets/catalog/${fam}/${sku}/gallery/${webp}`);
        add(`/assets/catalog/${fam}/${sku}/gallery/${file}`);
        add(`/assets/catalog/${fam}/${sku}/detail/${webp}`);
        add(`/assets/catalog/${fam}/${sku}/detail/${file}`);
        add(`/assets/catalog/${fam}/${sku}/${webp}`);
      }
      // soft-seating family hint from oando-soft-seating
      if (sku.startsWith("oando-soft-seating--")) {
        add(`/assets/catalog/soft-seating/${sku}/gallery/${webp}`);
        add(`/assets/catalog/soft-seating/${sku}/gallery/${file}`);
      }
    }
    // flat products/imported → catalog/products/imported/slug/gallery
    const imp = cur.match(
      /^\/assets\/(?:catalog\/)?products\/imported\/([^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (imp) {
      const slug = imp[1];
      const file = imp[2];
      const webp = file.replace(/\.(jpe?g|png)$/i, ".webp");
      add(`/assets/catalog/products/imported/${slug}/gallery/${webp}`);
      add(`/assets/catalog/products/imported/${slug}/gallery/${file}`);
      add(`/assets/catalog/products/imported/${slug}/${webp}`);
    }
    // /assets/products/foo → /assets/catalog/products/foo
    const prod = cur.match(/^\/assets\/products\/(.+)$/i);
    if (prod) {
      add(`/assets/catalog/products/${prod[1]}`);
    }
    // CMS hash files at catalog root → may live under detail/ somewhere (leave as-is)
    // seating product imported under family SKU gallery
    const seatImp = cur.match(
      /^\/assets\/products\/imported\/([^/]+)\/(image-\d+\.[a-z0-9]+)$/i,
    );
    if (seatImp) {
      const slug = seatImp[1];
      const file = seatImp[2].replace(/\.(jpe?g|png)$/i, ".webp");
      const aliases = { breez: "breeze", xmesh: "x-mesh" };
      const key = aliases[slug] || slug;
      for (const fam of FAMILY_PREFIX) {
        add(
          `/assets/catalog/${fam}/oando-${fam}--${key}/gallery/${file}`,
        );
      }
    }
  }
  return [...out];
}

function resolveLocal(webPath) {
  const cands = candidateWebPaths(webPath);
  for (const c of cands) {
    if (!c.startsWith("/assets/") && !c.startsWith("/images/")) continue;
    const fsPath = resolve(assetsRoot, c.replace(/^\//, ""));
    if (existsSync(fsPath)) {
      return { ok: true, requested: webPath, resolved: c, fs: fsPath };
    }
  }
  return {
    ok: false,
    requested: webPath,
    tried: cands.slice(0, 12),
  };
}

function webToFs(webPath) {
  if (!webPath || typeof webPath !== "string") return null;
  let p = webPath.trim().split("?")[0];
  if (p.startsWith("http://") || p.startsWith("https://")) {
    try {
      const u = new URL(p);
      if (
        u.hostname.includes("supabase") ||
        u.pathname.includes("/storage/v1/object/")
      ) {
        return { kind: "supabase-storage", path: p, pathname: u.pathname };
      }
      p = u.pathname;
    } catch {
      return { kind: "remote", path: webPath };
    }
  }
  if (p.startsWith("/assets/") || p.startsWith("/images/")) {
    return {
      kind: "local",
      path: p,
      fs: resolve(assetsRoot, p.replace(/^\//, "")),
    };
  }
  if (p.includes("catalog-assets") || p.includes("storage/v1")) {
    return { kind: "supabase-storage", path: p };
  }
  return { kind: "other", path: p };
}

async function main() {
  const { data: products, error: pe } = await sb
    .from("products")
    .select(
      "id,slug,name,category_id,images,flagship_image,scene_images",
    )
    .order("name");
  if (pe) throw new Error(`products: ${pe.message}`);

  let productImages = [];
  const { data: pi, error: pie } = await sb
    .from("product_images")
    .select("product_id,image_url,image_kind,sort_order")
    .limit(5000);
  if (!pie) productImages = pi || [];
  else console.log("product_images:", pie.message);

  let furniture = [];
  if (adminSb) {
    const { data: fur, error: fe } = await adminSb
      .from("furniture_catalog")
      .select(
        "id,name,thumbnail_url,top_png_url,front_png_url,side_png_url,top_svg_url",
      )
      .limit(5000);
    if (!fe) furniture = fur || [];
    else console.log("furniture_catalog (admin):", fe.message);
  } else {
    console.log("furniture_catalog: skipped — admin Supabase env vars missing");
  }

  const emptyImages = [];
  const brokenLocal = [];
  const okLocal = [];
  const remappedOk = [];
  const remoteOnly = [];

  for (const row of products || []) {
    const imgs = Array.isArray(row.images)
      ? row.images.filter(Boolean)
      : [];
    const flag = row.flagship_image || imgs[0] || null;
    if (!flag && imgs.length === 0) {
      emptyImages.push({
        id: row.id,
        slug: row.slug,
        name: row.name,
        category_id: row.category_id,
      });
      continue;
    }
    const toCheck = [
      ...new Set(
        [flag, ...imgs, ...(row.scene_images || [])].filter(Boolean),
      ),
    ];
    for (const img of toCheck) {
      const mapped = webToFs(img);
      if (!mapped) continue;
      if (mapped.kind === "local") {
        const resolved = resolveLocal(img);
        if (resolved.ok) {
          okLocal.push(resolved.resolved);
          if (resolved.resolved !== img && resolved.resolved !== mapped.path) {
            remappedOk.push({
              product: row.slug || row.name,
              from: img,
              to: resolved.resolved,
            });
          }
        } else {
          brokenLocal.push({
            product: row.slug || row.name,
            category: row.category_id,
            url: img,
            tried: resolved.tried,
          });
        }
      } else if (
        mapped.kind === "remote" ||
        mapped.kind === "supabase-storage"
      ) {
        remoteOnly.push({
          product: row.slug || row.name,
          url: img,
          kind: mapped.kind,
        });
      } else {
        brokenLocal.push({
          product: row.slug || row.name,
          category: row.category_id,
          url: img,
          tried: [],
        });
      }
    }
  }

  const brokenPaths = new Map();
  for (const b of brokenLocal) {
    const k = b.url;
    if (!brokenPaths.has(k)) {
      brokenPaths.set(k, { url: k, products: [], count: 0 });
    }
    const e = brokenPaths.get(k);
    e.count++;
    if (e.products.length < 8) e.products.push(b.product);
  }

  const furnitureMissing = furniture.filter(
    (f) => !f.thumbnail_url && !f.top_png_url,
  );
  const furnitureUrlBroken = [];
  for (const f of furniture) {
    for (const field of [
      "thumbnail_url",
      "top_png_url",
      "front_png_url",
      "side_png_url",
      "top_svg_url",
    ]) {
      const u = f[field];
      if (!u) continue;
      const mapped = webToFs(u);
      if (mapped?.kind === "local" && !resolveLocal(u).ok) {
        furnitureUrlBroken.push({
          id: f.id,
          name: f.name,
          field,
          url: u,
        });
      }
    }
  }

  const piBroken = [];
  for (const row of productImages) {
    const mapped = webToFs(row.image_url);
    if (mapped?.kind === "local" && !resolveLocal(row.image_url).ok) {
      piBroken.push({
        product_id: row.product_id,
        url: row.image_url,
        kind: row.image_kind,
      });
    }
  }

  // Sample HEAD for unique broken paths that might resolve via nest? skip.
  // List storage buckets / catalog-assets prefixes
  let storage = { ok: false, buckets: [], catalogAssetsTop: [], error: null };
  try {
    const { data: buckets, error: be } = await sb.storage.listBuckets();
    if (be) {
      storage.error = be.message;
    } else {
      storage.ok = true;
      storage.buckets = (buckets || []).map((b) => b.name);
      if (storage.buckets.includes("catalog-assets")) {
        const { data: root, error: re } = await sb.storage
          .from("catalog-assets")
          .list("", { limit: 100 });
        if (!re) {
          storage.catalogAssetsTop = (root || []).map((x) => ({
            name: x.name,
            id: x.id,
            metadata: x.metadata,
          }));
        } else {
          storage.error = re.message;
        }
      }
    }
  } catch (e) {
    storage.error = String(e);
  }

  // Check a sample of remote/supabase URLs with HEAD (max 30 unique)
  const remoteUnique = [
    ...new Set(remoteOnly.map((r) => r.url)),
  ].slice(0, 30);
  const remoteHead = [];
  for (const remoteUrl of remoteUnique) {
    try {
      const res = await fetch(remoteUrl, { method: "HEAD" });
      remoteHead.push({
        url: remoteUrl,
        status: res.status,
        ok: res.ok,
      });
    } catch (e) {
      remoteHead.push({
        url: remoteUrl,
        status: 0,
        ok: false,
        error: String(e?.message || e),
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    host: new URL(url).host,
    products: {
      total: (products || []).length,
      emptyImagesArray: emptyImages.length,
      emptyImageRows: emptyImages,
      brokenLocalRefs: brokenLocal.length,
      uniqueBrokenPaths: brokenPaths.size,
      uniqueBrokenSample: [...brokenPaths.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 80),
      okLocalRefs: okLocal.length,
      remappedOkCount: remappedOk.length,
      remappedOkSample: remappedOk.slice(0, 40),
      remoteOrStorageRefs: remoteOnly.length,
      remoteSample: remoteOnly.slice(0, 30),
      remoteHeadSample: remoteHead,
    },
    product_images: {
      total: productImages.length,
      brokenLocal: piBroken.length,
      brokenSample: piBroken.slice(0, 40),
    },
    furniture_catalog: {
      total: furniture.length,
      missingThumbAndTop: furnitureMissing.length,
      missingSample: furnitureMissing
        .slice(0, 30)
        .map((f) => ({ id: f.id, name: f.name })),
      localUrlBroken: furnitureUrlBroken.length,
      localUrlBrokenSample: furnitureUrlBroken.slice(0, 20),
    },
    storage,
  };

  const outDir = resolve(process.cwd(), "results/asset-cutover");
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, "supabase-missing-images.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(
    JSON.stringify(
      {
        products: report.products.total,
        emptyImages: report.products.emptyImagesArray,
        brokenLocalRefs: report.products.brokenLocalRefs,
        uniqueBrokenPaths: report.products.uniqueBrokenPaths,
        okLocal: report.products.okLocalRefs,
        remappedOk: report.products.remappedOkCount,
        remote: report.products.remoteOrStorageRefs,
        productImagesTotal: report.product_images.total,
        productImagesBroken: report.product_images.brokenLocal,
        furniture: report.furniture_catalog.total,
        furnitureMissing: report.furniture_catalog.missingThumbAndTop,
        furnitureLocalBroken: report.furniture_catalog.localUrlBroken,
        buckets: report.storage.buckets,
        catalogAssetsTop: report.storage.catalogAssetsTop.map((x) => x.name),
        storageError: report.storage.error,
        report: outPath,
      },
      null,
      2,
    ),
  );

  console.log("\n--- empty image products (no images[] / flagship) ---");
  for (const e of emptyImages) {
    console.log(`  ${(e.category_id || "?").padEnd(28)} ${e.slug || e.name}`);
  }

  console.log("\n--- top broken local paths ---");
  for (const b of report.products.uniqueBrokenSample.slice(0, 40)) {
    console.log(`  ${String(b.count).padStart(3)}x  ${b.url}`);
    console.log(`       products: ${b.products.join(", ")}`);
  }

  console.log("\n--- remote HEAD sample ---");
  for (const h of remoteHead.slice(0, 15)) {
    console.log(`  ${h.ok ? "OK" : "FAIL"} ${h.status} ${h.url.slice(0, 120)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
