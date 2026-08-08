import { describe, expect, it } from "vitest";
import {
  getFurnitureCatalogMode,
  isFurnitureCatalogConfigured,
} from "@/lib/catalog/furnitureCatalogMode";

function env(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv;
}

describe("furnitureCatalogMode", () => {
  it("disk when DEV_AUTH_BYPASS=1 and not production", () => {
    const e = env({ NODE_ENV: "development", DEV_AUTH_BYPASS: "1" });
    expect(getFurnitureCatalogMode(e)).toBe("disk");
    expect(isFurnitureCatalogConfigured(e)).toBe(true);
  });

  it("supabase when bypass off", () => {
    expect(getFurnitureCatalogMode(env({ NODE_ENV: "development" }))).toBe(
      "supabase",
    );
  });

  it("never uses disk in production — the filesystem is read-only there", () => {
    const e = env({ NODE_ENV: "production", DEV_AUTH_BYPASS: "1" });
    expect(getFurnitureCatalogMode(e)).toBe("supabase");
  });

  it("supabase not configured without admin service env", () => {
    expect(isFurnitureCatalogConfigured(env({ NODE_ENV: "production" }))).toBe(
      false,
    );
  });

  it("supabase configured from admin env", () => {
    expect(
      isFurnitureCatalogConfigured(
        env({
          NODE_ENV: "production",
          NEXT_ADMIN_SUPABASE_URL: "https://admin.supabase.co",
          SUPABASE_ADMIN_SERVICE_ROLE_KEY: "service-role-key",
        }),
      ),
    ).toBe(true);
  });

  it("service key alone is not enough", () => {
    expect(
      isFurnitureCatalogConfigured(
        env({ NODE_ENV: "production", SUPABASE_ADMIN_SERVICE_ROLE_KEY: "k" }),
      ),
    ).toBe(false);
  });
});
