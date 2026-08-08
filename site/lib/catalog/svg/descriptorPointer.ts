/**
 * Phase 08 — versioned descriptor pointer (`{slug}.latest.json`).
 *
 * §08-PERS-02 / §08-PERS-06: shared between writer and loader.
 */

import {
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { randomBytes } from "node:crypto";

import { BLOCK_DESCRIPTOR_SCHEMA_VERSION } from "./svgTypes";

export interface DescriptorLatestPointer {
  readonly slug: string;
  readonly n: number;
  readonly checksum: string;
  readonly schemaVersion: string;
}

export function latestPointerPath(slug: string, dir: string): string {
  return path.resolve(dir, `${slug}.latest.json`);
}

export function versionedDescriptorPath(slug: string, n: number, dir: string): string {
  return path.resolve(dir, `${slug}.${n}.json`);
}

export function legacyDescriptorPath(slug: string, dir: string): string {
  return path.resolve(dir, `${slug}.json`);
}

export function isVersionedDescriptorFilename(filename: string): boolean {
  return /^[a-z][a-z0-9-]+\.\d+\.json$/.test(filename);
}

export function isLatestPointerFilename(filename: string): boolean {
  return /^[a-z][a-z0-9-]+\.latest\.json$/.test(filename);
}

export function slugFromLatestPointerFilename(filename: string): string | null {
  const match = /^([a-z][a-z0-9-]+)\.latest\.json$/.exec(filename);
  return match?.[1] ?? null;
}

export function isLegacyDescriptorFilename(filename: string): boolean {
  return /^[a-z][a-z0-9-]+\.json$/.test(filename);
}

export function readLatestPointer(
  slug: string,
  dir: string,
): DescriptorLatestPointer | null {
  const pointerPath = latestPointerPath(slug, dir);
  if (!existsSync(pointerPath)) {return null;}
  try {
    const raw = readFileSync(pointerPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {return null;}
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.slug !== "string" ||
      typeof record.n !== "number" ||
      typeof record.checksum !== "string" ||
      typeof record.schemaVersion !== "string"
    ) {
      return null;
    }
    if (record.slug !== slug || record.n < 1) {return null;}
    return {
      slug: record.slug,
      n: record.n,
      checksum: record.checksum,
      schemaVersion: record.schemaVersion,
    };
  } catch {
    return null;
  }
}

export function writeLatestPointer(
  pointer: DescriptorLatestPointer,
  dir: string,
): void {
  const target = latestPointerPath(pointer.slug, dir);
  const suffix = randomBytes(8).toString("hex");
  const temp = path.resolve(dir, `.${pointer.slug}.latest.tmp-${suffix}`);
  const body = `${JSON.stringify(pointer)}\n`;
  writeFileSync(temp, body, { encoding: "utf8", flag: "wx" });
  renameSync(temp, target);
}

export function resolveCurrentVersion(slug: string, dir: string): number {
  const pointer = readLatestPointer(slug, dir);
  if (pointer) {return pointer.n;}
  if (existsSync(legacyDescriptorPath(slug, dir))) {return 1;}
  return 0;
}

export function resolveDescriptorReadPath(slug: string, dir: string): string | null {
  const pointer = readLatestPointer(slug, dir);
  if (pointer) {
    const versioned = versionedDescriptorPath(slug, pointer.n, dir);
    if (existsSync(versioned)) {return versioned;}
  }
  const legacy = legacyDescriptorPath(slug, dir);
  if (existsSync(legacy)) {return legacy;}
  return null;
}

export function buildPointer(
  slug: string,
  n: number,
  checksum: string,
): DescriptorLatestPointer {
  return {
    slug,
    n,
    checksum,
    schemaVersion: BLOCK_DESCRIPTOR_SCHEMA_VERSION,
  };
}
