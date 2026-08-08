/**
 * Seed `public.furniture_catalog` (admin DB) from the Studio seed spec.
 *
 * Supabase mode has no equivalent of the disk seeder — `ensureFurnitureSeeded`
 * is disk-only, because a GET handler must not write and production's
 * filesystem is read-only. Run this once per environment after `db:apply`:
 *
 *   pnpm run seed:furniture
 *   pnpm run seed:furniture -- --dry
 *
 * Idempotent: existing ids are left alone unless --force is passed.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("./general/loadEnvLocal.cjs").loadEnvLocal();

type SeedSpec = {
  id: string;
  name: string;
  category: string;
  subcategory?: string | null;
  tags?: string[];
  dimensions: { width_mm: number; depth_mm: number; height_mm: number };
  notes?: string | null;
  svg: string;
};

const SEED_PATH = resolve(
  process.cwd(),
  "site",
  "platform",
  "Studio",
  "data",
  "seed-furniture.json",
);

async function main() {
  const dry = process.argv.includes("--dry");
  const force = process.argv.includes("--force");

  const url = process.env.SUPABASE_AUTH_DATABASE_URL?.trim();
  if (!url) {
    console.error("Missing SUPABASE_AUTH_DATABASE_URL (admin DB)");
    process.exit(1);
  }

  let specs: SeedSpec[];
  try {
    specs = JSON.parse(readFileSync(SEED_PATH, "utf8")) as SeedSpec[];
  } catch (e) {
    console.error(`Cannot read seed spec at ${SEED_PATH}:`, e);
    process.exit(1);
  }

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    const existing = await sql<Array<{ id: string }>>`
      select id from public.furniture_catalog
    `;
    const have = new Set(existing.map((r) => r.id));
    const pending = force ? specs : specs.filter((s) => !have.has(s.id));

    console.log(`Seed specs: ${specs.length}`);
    console.log(`Already present: ${have.size}`);
    console.log(`To write: ${pending.length}${force ? " (--force)" : ""}`);
    if (dry || pending.length === 0) {
      if (pending.length === 0) console.log("  (nothing to do)");
      return;
    }

    for (const spec of pending) {
      // Seed art is inline SVG in the spec; store it as a data URL so the row
      // is self-contained and needs no bucket round-trip.
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(spec.svg, "utf8").toString("base64")}`;
      await sql`
        insert into public.furniture_catalog (
          id, name, category, subcategory, tags, dimensions, notes,
          is_custom, thumbnail_url, top_svg_url
        ) values (
          ${spec.id}, ${spec.name}, ${spec.category}, ${spec.subcategory ?? null},
          ${spec.tags ?? []}, ${sql.json(spec.dimensions)}, ${spec.notes ?? null},
          false, ${svgDataUrl}, ${svgDataUrl}
        )
        on conflict (id) do update set
          name = excluded.name,
          category = excluded.category,
          subcategory = excluded.subcategory,
          tags = excluded.tags,
          dimensions = excluded.dimensions,
          notes = excluded.notes,
          is_custom = false,
          thumbnail_url = excluded.thumbnail_url,
          top_svg_url = excluded.top_svg_url,
          updated_at = now()
      `;
      console.log(`  seeded ${spec.id}`);
    }
    console.log("Done.");
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
