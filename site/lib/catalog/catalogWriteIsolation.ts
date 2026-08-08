/**
 * Catalog write isolation — refuse writes outside allowed roots.
 */

export class CatalogIsolationError extends Error {
  readonly code = "catalog_write_isolation";
  constructor(message: string) {
    super(message);
    this.name = "CatalogIsolationError";
  }
}

export type CatalogWriteIsolationOptions = {
  allowedRoots: readonly string[];
};

function normalize(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

/**
 * Assert target path is under one of the allowed roots (absolute paths).
 */
export function assertCatalogWriteAllowed(
  targetPath: string,
  opts: CatalogWriteIsolationOptions,
): void {
  const target = normalize(targetPath);
  if (!target) {
    throw new CatalogIsolationError("Empty catalog write path");
  }
  const ok = opts.allowedRoots.some((root) => {
    const r = normalize(root);
    return target === r || target.startsWith(`${r}/`);
  });
  if (!ok) {
    throw new CatalogIsolationError(
      `Catalog write blocked outside allowed roots: ${targetPath}`,
    );
  }
}
