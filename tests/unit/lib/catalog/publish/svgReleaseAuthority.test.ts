import { setNodeEnv } from "@/tests/helpers/setNodeEnv";
import { afterEach, describe, expect, it } from "vitest";

import {
  getDbReleaseAuthorityDualWriteBlockError,
  getSvgReleaseAuthority,
  isDbSvgReleaseAuthority,
  isPngDevMirrorWriteEnabled,
  isSvgCatalogDiskWriteEnabled,
  isSvgDualWriteEnabled,
} from "@/lib/catalog/publish/svgReleaseAuthority";

describe("svgReleaseAuthority", () => {
  afterEach(() => {
    delete process.env.SVG_RELEASE_AUTHORITY;
    delete process.env.SVG_DISK_WRITE;
    delete process.env.SVG_DUAL_WRITE;
    delete process.env.PNG_DISK_MIRROR;
    setNodeEnv(undefined);
  });

  // Owner model: dev writes the local mirror to disk, live writes to the web only.
  it("gates the PNG dev mirror to development/test and never to production", () => {
    expect(isPngDevMirrorWriteEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isPngDevMirrorWriteEnabled({ NODE_ENV: "test" })).toBe(true);

    // Production is web-only — the FS is never touched, with or without the flag.
    expect(isPngDevMirrorWriteEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isPngDevMirrorWriteEnabled({ NODE_ENV: "production", PNG_DISK_MIRROR: "1" }),
    ).toBe(false);

    // Explicit off wins in dev.
    for (const off of ["0", "false", "off", "no"]) {
      expect(
        isPngDevMirrorWriteEnabled({ NODE_ENV: "development", PNG_DISK_MIRROR: off }),
      ).toBe(false);
    }

    // Explicit on is still confined to dev/test.
    for (const on of ["1", "true", "on", "yes"]) {
      expect(
        isPngDevMirrorWriteEnabled({ NODE_ENV: "development", PNG_DISK_MIRROR: on }),
      ).toBe(true);
      expect(isPngDevMirrorWriteEnabled({ PNG_DISK_MIRROR: on })).toBe(false);
    }

    // Unknown / script environments do not write to disk.
    expect(isPngDevMirrorWriteEnabled({})).toBe(false);
    expect(isPngDevMirrorWriteEnabled({ NODE_ENV: "staging" })).toBe(false);
  });

  it("resolves disk vs db authority across env matrices", () => {
    expect(getSvgReleaseAuthority({})).toBe("disk");
    expect(getSvgReleaseAuthority({ NODE_ENV: "development" })).toBe("disk");
    expect(getSvgReleaseAuthority({ NODE_ENV: "test" })).toBe("disk");
    expect(getSvgReleaseAuthority({ SVG_RELEASE_AUTHORITY: "  " })).toBe("disk");
    expect(getSvgReleaseAuthority({ SVG_RELEASE_AUTHORITY: "disk" })).toBe("disk");
    expect(getSvgReleaseAuthority({ SVG_RELEASE_AUTHORITY: "banana" })).toBe("disk");
    expect(
      getSvgReleaseAuthority({
        NODE_ENV: "development",
        SVG_RELEASE_AUTHORITY: "disk",
      }),
    ).toBe("disk");
    expect(isDbSvgReleaseAuthority({})).toBe(false);

    expect(getSvgReleaseAuthority({ NODE_ENV: "production" })).toBe("db");
    expect(
      getSvgReleaseAuthority({
        NODE_ENV: "production",
        SVG_RELEASE_AUTHORITY: "disk",
      }),
    ).toBe("db");
    expect(
      getSvgReleaseAuthority({
        NODE_ENV: "production",
        SVG_RELEASE_AUTHORITY: "banana",
      }),
    ).toBe("db");
    expect(isDbSvgReleaseAuthority({ NODE_ENV: "production" })).toBe(true);

    for (const raw of ["db", "DB", "database", "r2"] as const) {
      expect(getSvgReleaseAuthority({ SVG_RELEASE_AUTHORITY: raw })).toBe("db");
    }
    expect(
      getSvgReleaseAuthority({
        NODE_ENV: "development",
        SVG_RELEASE_AUTHORITY: "db",
      }),
    ).toBe("db");
    expect(isDbSvgReleaseAuthority({ SVG_RELEASE_AUTHORITY: "db" })).toBe(true);
  });

  it("disk-write + dual-write flags and legacy dual-write block gate", () => {
    expect(isSvgDualWriteEnabled({})).toBe(false);
    expect(isSvgDualWriteEnabled({ SVG_DUAL_WRITE: "1" })).toBe(true);
    expect(isSvgDualWriteEnabled({ SVG_DUAL_WRITE: "true" })).toBe(true);
    expect(isSvgDualWriteEnabled({ SVG_DUAL_WRITE: "on" })).toBe(true);
    expect(isSvgDualWriteEnabled({ SVG_DUAL_WRITE: "yes" })).toBe(true);
    expect(isSvgDualWriteEnabled({ SVG_DUAL_WRITE: "0" })).toBe(false);

    expect(isSvgCatalogDiskWriteEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isSvgCatalogDiskWriteEnabled({ NODE_ENV: "test" })).toBe(true);
    expect(isSvgCatalogDiskWriteEnabled({})).toBe(false);
    expect(isSvgCatalogDiskWriteEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(
      isSvgCatalogDiskWriteEnabled({
        NODE_ENV: "production",
        SVG_DISK_WRITE: "1",
      }),
    ).toBe(false);
    expect(
      isSvgCatalogDiskWriteEnabled({
        SVG_RELEASE_AUTHORITY: "db",
        NODE_ENV: "development",
      }),
    ).toBe(false);
    expect(
      isSvgCatalogDiskWriteEnabled({
        SVG_RELEASE_AUTHORITY: "db",
        NODE_ENV: "development",
        SVG_DISK_WRITE: "1",
      }),
    ).toBe(true);
    expect(
      isSvgCatalogDiskWriteEnabled({
        SVG_DISK_WRITE: "0",
        NODE_ENV: "development",
      }),
    ).toBe(false);
    expect(isSvgCatalogDiskWriteEnabled({ SVG_DISK_WRITE: "off" })).toBe(false);
    expect(
      isSvgCatalogDiskWriteEnabled({
        SVG_DISK_WRITE: "false",
        NODE_ENV: "development",
      }),
    ).toBe(false);
    expect(
      isSvgCatalogDiskWriteEnabled({
        SVG_DISK_WRITE: "true",
        NODE_ENV: "development",
      }),
    ).toBe(true);

    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        mode: "skipped_no_db",
        env: {},
      }),
    ).toBeNull();
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: true,
        mode: "enabled",
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toBeNull();
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        mode: "skipped_no_db",
        env: { SVG_RELEASE_AUTHORITY: "db" },
      }),
    ).toBeNull();

    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        mode: "skipped_no_db",
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toBe("DB release authority requires PRODUCTS_DATABASE_URL");
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        mode: "skipped_r2_unavailable",
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toMatch(/R2/i);
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        mode: "skipped_schema_missing",
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toMatch(/published_svg_revision_id|db:apply/i);
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        productsDbConfigured: false,
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toBe("DB release authority requires PRODUCTS_DATABASE_URL");
    expect(
      getDbReleaseAuthorityDualWriteBlockError({
        dualWriteReady: false,
        productsDbConfigured: true,
        env: { SVG_RELEASE_AUTHORITY: "db", SVG_DUAL_WRITE: "1" },
      }),
    ).toBe("DB release authority requires reachable R2 catalog storage");
  });
});
