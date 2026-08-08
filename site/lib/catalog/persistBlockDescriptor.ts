/**
 * Versioned block-descriptor writer (simplified port of product-studio persist).
 * Writes `{slug}.{n}.json` + `{slug}.latest.json` under an isolated dir.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

import { assertCatalogWriteAllowed } from "@/lib/catalog/catalogWriteIsolation";

export type PersistBlockDescriptorInput = {
  dir: string;
  slug: string;
  descriptor: Record<string, unknown>;
  allowedRoots?: readonly string[];
};

export type PersistBlockDescriptorResult = {
  version: number;
  versionPath: string;
  latestPath: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function nextVersion(dir: string, slug: string): number {
  let max = 0;
  if (!existsSync(dir)) return 1;
  // Avoid full readdir dependency on glob; probe sequential versions.
  for (let n = 1; n < 10_000; n += 1) {
    if (existsSync(path.join(dir, `${slug}.${n}.json`))) max = n;
    else break;
  }
  return max + 1;
}

export async function persistBlockDescriptor(
  input: PersistBlockDescriptorInput,
): Promise<PersistBlockDescriptorResult> {
  const slug = input.slug.trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    throw new Error(`Invalid descriptor slug: ${input.slug}`);
  }
  const dir = path.resolve(input.dir);
  const roots = input.allowedRoots ?? [dir];
  assertCatalogWriteAllowed(dir, { allowedRoots: roots });

  mkdirSync(dir, { recursive: true });
  const version = nextVersion(dir, slug);
  const versionPath = path.join(dir, `${slug}.${version}.json`);
  const latestPath = path.join(dir, `${slug}.latest.json`);
  const tmp = path.join(dir, `.${slug}.${version}.${randomBytes(4).toString("hex")}.tmp`);

  const body = JSON.stringify(
    {
      ...input.descriptor,
      slug,
      version,
      updatedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  writeFileSync(tmp, body, "utf8");
  renameSync(tmp, versionPath);
  writeFileSync(latestPath, body, "utf8");

  // Dual-read verify
  const verify = readFileSync(versionPath, "utf8");
  if (!verify.includes(slug)) {
    throw new Error("Descriptor dual-read verification failed");
  }

  return { version, versionPath, latestPath };
}
