/**
 * Name-mirror coverage for lib/tracking/userHistoryRepository.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchViewedProducts,
  isMissingUserHistoryTable,
  upsertViewedProducts,
} from "@/lib/tracking/userHistoryRepository";

function createClient(handlers: {
  selectResult?: { data: unknown; error: { message: string } | null };
  upsertResult?: { error: { message: string } | null };
}) {
  const maybeSingle = vi.fn().mockResolvedValue(
    handlers.selectResult ?? { data: null, error: null },
  );
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn().mockResolvedValue(
    handlers.upsertResult ?? { error: null },
  );
  const from = vi.fn(() => ({ select, upsert }));

  return {
    client: { from } as unknown as SupabaseClient,
    from,
    select,
    upsert,
    eq,
    maybeSingle,
  };
}

describe("isMissingUserHistoryTable", () => {
  it("detects missing-table messages", () => {
    expect(
      isMissingUserHistoryTable(
        'Could not find the table "public.user_history" in the schema cache',
      ),
    ).toBe(true);
    expect(
      isMissingUserHistoryTable(
        'relation "public.user_history" does not exist',
      ),
    ).toBe(true);
    expect(isMissingUserHistoryTable("permission denied")).toBe(false);
    expect(isMissingUserHistoryTable(undefined)).toBe(false);
  });
});

describe("fetchViewedProducts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns string product ids from viewed_products", async () => {
    const { client } = createClient({
      selectResult: {
        data: { viewed_products: ["a", "b", 3, null] },
        error: null,
      },
    });
    await expect(fetchViewedProducts(client, "user-1")).resolves.toEqual([
      "a",
      "b",
    ]);
  });

  it("returns empty array when no row exists", async () => {
    const { client } = createClient({
      selectResult: { data: null, error: null },
    });
    await expect(fetchViewedProducts(client, "user-1")).resolves.toEqual([]);
  });

  it("logs non-missing-table errors but still returns empty list", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = createClient({
      selectResult: {
        data: null,
        error: { message: "connection refused" },
      },
    });
    await expect(fetchViewedProducts(client, "user-1")).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("upsertViewedProducts", () => {
  it("returns ok when upsert succeeds", async () => {
    const { client, upsert } = createClient({
      upsertResult: { error: null },
    });
    await expect(
      upsertViewedProducts(client, "user-1", ["p1"]),
    ).resolves.toEqual({ ok: true, missingTable: false });
    expect(upsert).toHaveBeenCalled();
  });

  it("returns missingTable when table is absent", async () => {
    const { client } = createClient({
      upsertResult: {
        error: {
          message: 'Could not find the table public.user_history',
        },
      },
    });
    await expect(
      upsertViewedProducts(client, "user-1", ["p1"]),
    ).resolves.toEqual({ ok: false, missingTable: true });
  });

  it("returns failure for other upsert errors", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { client } = createClient({
      upsertResult: { error: { message: "write failed" } },
    });
    await expect(
      upsertViewedProducts(client, "user-1", ["p1"]),
    ).resolves.toEqual({ ok: false, missingTable: false });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
