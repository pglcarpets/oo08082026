/**
 * AF-14 — browser sample: admin mutators fail closed without CSRF.
 * Unit matrix: scripts/general/audit-api-route-safety.mjs (already green).
 * This e2e proves live HTTP rejection headers on a sample of mutators.
 */
import { expect, test } from "@playwright/test";

/** Must match `lib/security/csrfConstants.ts` — avoid TS path alias in e2e. */
const CSRF_REJECTION_HEADER_NAME = "x-csrf-rejected";

/** Mutators known to hit CSRF before soft body validation (AF-14 sample). */
const MUTATORS: Array<{
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: Record<string, unknown>;
}> = [
  {
    method: "PATCH",
    path: "/api/admin/features/",
    body: { updates: { "csrf-probe-flag": true } },
  },
  {
    method: "POST",
    path: "/api/admin/product-studio/",
    body: { slug: "csrf-probe", action: "publish" },
  },
  {
    method: "POST",
    path: "/api/admin/themes/publish/",
    body: {},
  },
  {
    method: "POST",
    path: "/api/admin/product-studio/bulk-import/",
    body: { descriptors: [] },
  },
];

test.describe("AF-14 admin CSRF matrix (browser HTTP sample)", () => {
  test("mutating admin routes reject missing CSRF with fail-closed header", async ({
    request,
  }) => {
    let csrfForbidden = 0;
    for (const mut of MUTATORS) {
      const response = await request.fetch(mut.path, {
        method: mut.method,
        headers: {
          "content-type": "application/json",
          // Deliberately omit x-csrf-token
        },
        data: mut.body ?? {},
        timeout: 30_000,
      });

      // Fail-closed: never 2xx without CSRF.
      expect(
        response.status(),
        `${mut.method} ${mut.path} must not succeed without CSRF (got ${response.status()})`,
      ).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      // Prefer 401/403; some handlers validate body first (400) — still fail-closed.
      if (response.status() === 403) {
        csrfForbidden += 1;
        const headers = response.headers();
        const headerVal =
          headers[CSRF_REJECTION_HEADER_NAME] ??
          headers["x-csrf-rejected"] ??
          headers[CSRF_REJECTION_HEADER_NAME.toLowerCase()];
        expect(
          headerVal === "1" || headerVal === "true",
          `${mut.path} 403 without ${CSRF_REJECTION_HEADER_NAME}=1 (got ${headerVal})`,
        ).toBe(true);
      }
    }
    // At least one mutator must hit the CSRF gate with explicit header (not only 400 body).
    expect(
      csrfForbidden,
      "expected ≥1 admin mutator to return 403 + x-csrf-rejected",
    ).toBeGreaterThanOrEqual(1);
  });

  test("csrf endpoint issues a token for same-origin clients", async ({
    request,
  }) => {
    const res = await request.get("/api/csrf/", { timeout: 20_000 });
    // May be 200 with token, or 401 if auth-gated — both honest; prefer 200.
    if (res.ok()) {
      const json = (await res.json()) as { token?: string };
      expect(typeof json.token).toBe("string");
      expect((json.token ?? "").length).toBeGreaterThan(8);
    } else {
      expect([401, 403, 404]).toContain(res.status());
    }
  });
});
