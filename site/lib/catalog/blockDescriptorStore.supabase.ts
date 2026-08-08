/**
 * Block descriptors — Supabase-only (`public.block_descriptors`, products DB).
 *
 * The disk writer (`persistBlockDescriptor`) keeps one file per version plus a
 * `.latest.json` pointer under `site/inventory/descriptors/`. The table holds
 * only the current release — `current_version` / `current_checksum` /
 * `descriptor` / `lifecycle` — which is what the publish contract actually
 * needs; per-version history was never read back by the app.
 *
 * Call only when `getFurnitureCatalogMode()` is `supabase`. No dual-write.
 */

import "server-only";

import { createSupabaseAdminClient } from "@/platform/supabase/supabaseAdmin";
import type { CatalogLifecycleState } from "./lifecycle/catalogLifecycle.shared";

const TABLE = "block_descriptors";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type PersistBlockDescriptorToSupabaseInput = {
  slug: string;
  descriptor: Record<string, unknown>;
  checksum?: string | null;
  lifecycle?: CatalogLifecycleState;
};

export type PersistBlockDescriptorToSupabaseResult = {
  slug: string;
  version: number;
};

function table(client: ReturnType<typeof createSupabaseAdminClient>) {
  return client.from(TABLE);
}

/**
 * Publish a descriptor, bumping `current_version`.
 *
 * Read-then-write rather than a single statement: PostgREST cannot express
 * `current_version = block_descriptors.current_version + 1` in an upsert. Two
 * concurrent publishes of the *same slug* could therefore land on the same
 * version number — acceptable here because publish is an operator action on a
 * single slug, and the row content is last-write-wins either way.
 */
export async function persistBlockDescriptorToSupabase(
  input: PersistBlockDescriptorToSupabaseInput,
): Promise<PersistBlockDescriptorToSupabaseResult> {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid descriptor slug: ${input.slug}`);
  }

  const client = createSupabaseAdminClient();

  const { data: existing, error: readError } = await table(client)
    .select("current_version")
    .eq("slug", slug)
    .maybeSingle();
  if (readError) {
    throw new Error(`block_descriptors read failed: ${readError.message}`);
  }

  const previous = (existing as { current_version?: number } | null)?.current_version;
  const version = typeof previous === "number" && previous > 0 ? previous + 1 : 1;

  const row = {
    slug,
    current_version: version,
    current_checksum: input.checksum ?? null,
    descriptor: {
      ...input.descriptor,
      slug,
      version,
      updatedAt: new Date().toISOString(),
    },
    lifecycle: input.lifecycle ?? "draft",
    updated_at: new Date().toISOString(),
    updated_by: null,
  };

  const { error: writeError } = await table(client).upsert(row, {
    onConflict: "slug",
  });
  if (writeError) {
    throw new Error(`block_descriptors upsert failed: ${writeError.message}`);
  }

  return { slug, version };
}

/** Buyer visibility lives on the release row — no disk manifest involved. */
export async function setBlockDescriptorLifecycleInSupabase(
  slug: string,
  lifecycle: CatalogLifecycleState,
): Promise<void> {
  const { error } = await table(createSupabaseAdminClient())
    .update({ lifecycle, updated_at: new Date().toISOString() })
    .eq("slug", slug.trim().toLowerCase());
  if (error) {
    throw new Error(`block_descriptors lifecycle update failed: ${error.message}`);
  }
}
