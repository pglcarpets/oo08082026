import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveProductImages } from "@/lib/catalog/site/imageMetadata";
import { REPO_ROOT } from "./lib/repoRoot";

config({ path: resolve(process.cwd(), ".env.local") });

type ProductRow = {
  id: string;
  slug: string | null;
  name: string | null;
  category_id: string | null;
  images: string[] | null;
  flagship_image: string | null;
  scene_images: string[] | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, name, category_id, images, flagship_image, scene_images")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`[products] ${error.message}`);
  }

  const rows = (data ?? []) as ProductRow[];
  const candidates = rows.filter((row) => !row.images || row.images.length === 0);
  const updated: Array<{
    id: string;
    slug: string | null;
    source: string;
    imageCount: number;
  }> = [];
  const unresolved: string[] = [];

  for (const row of candidates) {
    if (!row.name) {
      unresolved.push(`${row.category_id}/${row.slug ?? row.id}`);
      continue;
    }

    const resolvedImages = resolveProductImages({
      categoryId: row.category_id,
      name: row.name,
      slug: row.slug,
    });

    if (!resolvedImages) {
      unresolved.push(`${row.category_id}/${row.name}`);
      continue;
    }

    const images = resolvedImages.images;
    const flagshipImage = resolvedImages.flagshipImage ?? images[0] ?? null;
    const sceneImages = flagshipImage
      ? images.filter((image) => image !== flagshipImage)
      : images.slice(1);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        images,
        flagship_image: flagshipImage,
        scene_images: sceneImages,
      })
      .eq("id", row.id);

    if (updateError) {
      throw new Error(`[update:${row.id}] ${updateError.message}`);
    }

    updated.push({
      id: row.id,
      slug: row.slug,
      source: resolvedImages.source,
      imageCount: images.length,
    });
  }

  const reportDir = resolve(REPO_ROOT, "results", "audits");
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    resolve(reportDir, "missing-product-images-backfill-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalProductsScanned: rows.length,
        candidatesScanned: candidates.length,
        updatedCount: updated.length,
        unresolvedCount: unresolved.length,
        updated,
        unresolved,
      },
      null,
      2,
    ),
  );

  console.log(
    `[images-backfill] scanned=${candidates.length} updated=${updated.length} unresolved=${unresolved.length}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
