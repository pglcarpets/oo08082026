/**
 * @vitest-environment node
 *
 * Live round-trip for the Planner persistence path production actually runs.
 *
 * `getPlannerPersistenceMode()` returns `supabase` whenever `DEV_AUTH_BYPASS`
 * is not `1`, i.e. always in production. `public.oando_plans` held zero rows
 * because `ensurePlannerProfile` upserted `email`/`role` columns that
 * `public.profiles` does not have — PGRST204, rethrown, failing every save.
 *
 * This exercises create → list → load → delete against the real database so a
 * schema/shape drift of that kind cannot pass silently again.
 *
 * Skips when admin service env is missing.
 */
import { describe, it, expect, afterAll } from "vitest";
import {
  deleteProjectFromSupabase,
  listProjectsFromSupabase,
  loadProjectFromSupabase,
  writeProjectToSupabase,
} from "@planner/lib/projectsStore.supabase";
import { createSupabaseAuthAdminClient } from "@/platform/supabase/auth-admin";

const hasAdmin =
  Boolean(process.env.NEXT_ADMIN_SUPABASE_URL?.trim()) &&
  Boolean(process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim());

/** Fixed synthetic owner so a crashed run leaves one predictable row behind. */
const TEST_USER_ID = "00000000-0000-4000-8000-00000000d1a9";

describe.runIf(hasAdmin)("projectsStore.supabase → oando_plans (live)", () => {
  const createdPlanIds: string[] = [];

  afterAll(async () => {
    if (!hasAdmin) return;
    for (const id of createdPlanIds) {
      await deleteProjectFromSupabase(id).catch(() => undefined);
    }
    await createSupabaseAuthAdminClient()
      .from("profiles")
      .delete()
      .eq("id", TEST_USER_ID);
  });

  it("creates the owner profile and round-trips a plan", async () => {
    const name = `vitest-roundtrip-${Date.now()}`;

    const saved = await writeProjectToSupabase(
      {
        name,
        canvas_json: { objects: [{ type: "wall" }] },
        status: "active",
      },
      { userId: TEST_USER_ID, email: "vitest-roundtrip@example.com" },
    );

    const planId = String(saved.id);
    createdPlanIds.push(planId);

    expect(planId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(saved.name).toBe(name);
    expect(saved.user_id).toBe(TEST_USER_ID);

    const loaded = await loadProjectFromSupabase(planId);
    expect(loaded).not.toBeNull();
    expect(loaded?.name).toBe(name);
    expect(loaded?.canvas_json).toEqual({ objects: [{ type: "wall" }] });

    const listed = await listProjectsFromSupabase({ userId: TEST_USER_ID });
    expect(listed.some((p) => p.id === planId)).toBe(true);

    const renamed = await writeProjectToSupabase(
      { ...saved, name: `${name}-renamed` },
      { userId: TEST_USER_ID },
    );
    expect(renamed.id).toBe(planId);
    expect(renamed.name).toBe(`${name}-renamed`);

    expect(await deleteProjectFromSupabase(planId)).toBe(true);
    expect(await loadProjectFromSupabase(planId)).toBeNull();
    createdPlanIds.length = 0;
  }, 60_000);

  it("rejects a write with no owner rather than orphaning a row", async () => {
    await expect(writeProjectToSupabase({ name: "no-owner" }, {})).rejects.toThrow(
      /signed-in user id/i,
    );
  }, 30_000);
});
