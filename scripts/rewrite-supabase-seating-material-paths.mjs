/**
 * Rewrite product image paths after seating/{leather|non-leather}/ layout.
 * Usage: pnpm exec node scripts/rewrite-supabase-seating-material-paths.mjs
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Missing Supabase env");

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const LEATHER = new Set(["grace", "pinnacle", "moonlight", "rider"]);

function rewriteSafe(p) {
  if (typeof p !== "string") return p;
  if (/\/catalog\/seating\/(leather|non-leather)\//i.test(p)) return p;
  const m = p.match(
    /\/assets\/catalog\/seating\/(oando-seating--([^/?#]+))/i,
  );
  if (!m) return p;
  const sku = m[1];
  const slug = m[2].toLowerCase();
  const bucket = LEATHER.has(slug) ? "leather" : "non-leather";
  return p.replace(`/seating/${sku}`, `/seating/${bucket}/${sku}`);
}

async function main() {
  const { data: products, error } = await sb
    .from("products")
    .select("id,slug,images,flagship_image,scene_images");
  if (error) throw error;

  let updated = 0;
  for (const row of products || []) {
    const images = (row.images || []).map(rewriteSafe);
    const flag = rewriteSafe(row.flagship_image);
    const scene = (row.scene_images || []).map(rewriteSafe);
    const changed =
      JSON.stringify(images) !== JSON.stringify(row.images || []) ||
      flag !== row.flagship_image ||
      JSON.stringify(scene) !== JSON.stringify(row.scene_images || []);
    if (!changed) continue;
    const { error: e } = await sb
      .from("products")
      .update({
        images,
        flagship_image: flag,
        scene_images: scene,
      })
      .eq("id", row.id);
    if (e) console.error("fail", row.slug, e.message);
    else {
      updated++;
      console.log("OK", row.slug, "→", flag);
    }
  }
  console.log(`updated ${updated} of ${(products || []).length}`);
  const { data: sample } = await sb
    .from("products")
    .select("slug,flagship_image")
    .in("slug", ["grace", "breeze", "x-mesh", "pinnacle", "rider"]);
  console.log(sample);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
