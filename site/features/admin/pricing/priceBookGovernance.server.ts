/**
 * Server-only price book audit persistence (node:fs).
 * Client UI must import pure helpers from priceBookGovernance.ts only.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import path from "node:path";

import type { PriceBookAuditEntry } from "./priceBookGovernance";

const AUDIT_FILE = "_price-book-audit.jsonl";

export function priceBookAuditLogPath(dir: string): string {
  return path.resolve(dir, AUDIT_FILE);
}

export function appendPriceBookAudit(
  entry: PriceBookAuditEntry,
  dir: string,
): void {
  mkdirSync(dir, { recursive: true });
  appendFileSync(
    priceBookAuditLogPath(dir),
    `${JSON.stringify(entry)}\n`,
    "utf8",
  );
}

export function readPriceBookAudit(
  bookId: string,
  dir: string,
  limit = 40,
): PriceBookAuditEntry[] {
  const logPath = priceBookAuditLogPath(dir);
  if (!existsSync(logPath)) {return [];}
  const lines = readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean);
  const out: PriceBookAuditEntry[] = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    try {
      const parsed = JSON.parse(lines[i]) as PriceBookAuditEntry;
      if (parsed.bookId === bookId) {out.push(parsed);}
    } catch {
      // skip corrupt
    }
  }
  return out;
}
