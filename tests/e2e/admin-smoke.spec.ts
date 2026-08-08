import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { WORKSPACE_ROOT } from "../helpers/paths";

const EVIDENCE_DIR = path.join(WORKSPACE_ROOT, "results/admin/production-auth");

const ADMIN_ROUTES = [
  { path: "/admin", next: "%2Fadmin" },
  { path: "/admin/catalog", next: "%2Fadmin%2Fcatalog" },
  { path: "/admin/planner-catalog", next: "%2Fadmin%2Fplanner-catalog" },
  { path: "/admin/customer-queries", next: "%2Fadmin%2Fcustomer-queries" },
  { path: "/admin/analytics", next: "%2Fadmin%2Fanalytics" },
  // Canonical studio (legacy /admin/svg-editor redirects here).
  { path: "/admin/product-studio/", next: "%2Fadmin%2Fproduct-studio%2F" },
] as const;

/** When DEV_AUTH_BYPASS=1 the server is intentionally open; unauth gates do not apply. */
const authBypassOn = process.env.DEV_AUTH_BYPASS === "1";

test.describe("admin smoke â€” unauthenticated gate", () => {
  test.beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  });

  // Register redirect tests only when bypass is off (conditional suite; no .skip API).
  if (!authBypassOn) {
    for (const route of ADMIN_ROUTES) {
      test(`${route.path} redirects to access with next=`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page).toHaveURL(
          new RegExp(`/access/\\?next=${route.next}`),
        );
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          /Welcome to One&Only/i,
        );
        await expect(page.getByText(/Continue as Guest/i)).toBeVisible();
        if (route.path.startsWith("/admin/product-studio")) {
          await page.screenshot({
            path: path.join(EVIDENCE_DIR, "admin-product-studio-rejected.png"),
            fullPage: true,
            caret: "initial",
          });
        }
      });
    }
  } else {
    test("records that unauth redirects are inactive under DEV_AUTH_BYPASS=1", () => {
      expect(authBypassOn).toBe(true);
      writeFileSync(
        path.join(EVIDENCE_DIR, "unauth-redirects-inactive-under-bypass.json"),
        `${JSON.stringify({ authBypassOn: true, routes: ADMIN_ROUTES.map((r) => r.path) }, null, 2)}\n`,
        "utf8",
      );
    });
  }

  test("admin SVG publish API rejects an anonymous request", async ({
    request,
  }) => {
    const response = await request.post("/api/admin/product-studio", {
      data: { slug: "unauthorized-probe" },
    });
    const body = (await response.json().catch(() => ({}))) as {
      readonly success?: boolean;
      readonly error?: { readonly code?: string };
    };
    const evidence = {
      status: response.status(),
      success: body.success ?? false,
      errorCode: body.error?.code ?? null,
    };
    writeFileSync(
      path.join(EVIDENCE_DIR, "admin-svg-api-rejected.json"),
      `${JSON.stringify(evidence, null, 2)}\n`,
      "utf8",
    );

    // Rejected without a valid session/CSRF â€” 403 preferred; 422 is also a hard deny.
    expect([403, 401, 422]).toContain(response.status());
    expect(body.success).not.toBe(true);
  });

  test("auth-bypass-status reports environment honestly", async ({
    request,
  }) => {
    const response = await request.get("/api/dev/auth-bypass-status/");
    const body = (await response.json()) as {
      readonly bypassEnabled?: boolean;
      readonly nodeEnv?: string;
      readonly flagSet?: boolean;
    };
    writeFileSync(
      path.join(EVIDENCE_DIR, "production-bypass-status.json"),
      `${JSON.stringify(body, null, 2)}\n`,
      "utf8",
    );

    expect(response.ok()).toBe(true);
    if (body.nodeEnv === "production") {
      expect(body.bypassEnabled).toBe(false);
    } else {
      // Dev server may have bypass on; assert API shape, not a fake production claim.
      expect(typeof body.bypassEnabled).toBe("boolean");
      expect(body.nodeEnv).toBe("development");
    }
  });
});
