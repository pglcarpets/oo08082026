import type { SupabaseClient } from "@supabase/supabase-js";

export function isMissingUserHistoryTable(message: string | undefined): boolean {
  const normalized = (message || "").toLowerCase();
  return (
    normalized.includes("user_history") &&
    (normalized.includes("could not find the table") ||
      normalized.includes('relation "public.user_history" does not exist') ||
      normalized.includes("public.user_history") ||
      normalized.includes("does not exist"))
  );
}

export async function fetchViewedProducts(
  client: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("user_history")
    .select("viewed_products")
    .eq("user_id", userId)
    .maybeSingle();

  if (error && !isMissingUserHistoryTable(error.message)) {
    console.error("[userHistory] fetch error:", error.message);
  }

  return Array.isArray(data?.viewed_products)
    ? data.viewed_products.filter((item): item is string => typeof item === "string")
    : [];
}

export async function upsertViewedProducts(
  client: SupabaseClient,
  userId: string,
  viewedProducts: string[],
): Promise<{ ok: boolean; missingTable: boolean }> {
  const { error } = await client
    .from("user_history")
    .upsert(
      {
        user_id: userId,
        viewed_products: viewedProducts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (!error) {
    return { ok: true, missingTable: false };
  }

  if (isMissingUserHistoryTable(error.message)) {
    return { ok: false, missingTable: true };
  }

  console.error("[userHistory] upsert error:", error.message);
  return { ok: false, missingTable: false };
}