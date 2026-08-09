/**
 * @vitest-environment node
 *
 * Phase 3 — PNG upload checksum helper.
 *
 * `checksumPngBuffer` is the honest SHA-256 over PNG upload bytes
 * (SVG→PNG rasterization is retired). Validates non-empty Buffer requirement
 * and digest determinism against node:crypto.
 */

import { createHash } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  checksumPngBuffer,
  rasterizePublishedSvgPng,
} from "@/lib/catalog/publish/pngPublishChecksum";

describe("checksumPngBuffer", () => {
  it("returns the same buffer plus a sha256 hex digest", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = checksumPngBuffer(png);
    expect(result.png).toBe(png);
    expect(result.checksum).toBe(
      createHash("sha256").update(png).digest("hex"),
    );
    expect(result.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for identical bytes", () => {
    const png = Buffer.from("png-bytes-test");
    expect(checksumPngBuffer(png).checksum).toBe(checksumPngBuffer(png).checksum);
  });

  it("differs for different bytes", () => {
    const a = checksumPngBuffer(Buffer.from([1, 2, 3]));
    const b = checksumPngBuffer(Buffer.from([1, 2, 4]));
    expect(a.checksum).not.toBe(b.checksum);
  });

  it("throws on empty buffer", () => {
    expect(() => checksumPngBuffer(Buffer.alloc(0))).toThrow(
      /non-empty PNG bytes/,
    );
  });

  it("throws on non-Buffer input (Uint8Array)", () => {
    const u8 = new Uint8Array([0x89, 0x50]);
    expect(() => checksumPngBuffer(u8 as unknown as Buffer)).toThrow(
      /non-empty PNG bytes/,
    );
  });

  it("throws on null", () => {
    expect(() => checksumPngBuffer(null as unknown as Buffer)).toThrow(
      /non-empty PNG bytes/,
    );
  });
});

describe("rasterizePublishedSvgPng — retired fail-closed", () => {
  it("throws SVG publish retired for any markup", () => {
    expect(() => rasterizePublishedSvgPng("<svg/>")).toThrow(
      /SVG publish retired; use PNG/,
    );
  });

  it("throws even for empty input", () => {
    expect(() => rasterizePublishedSvgPng("")).toThrow(
      /SVG publish retired; use PNG/,
    );
  });
});
