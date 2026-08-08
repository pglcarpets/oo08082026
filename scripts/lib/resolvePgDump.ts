import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const pf = process.env.PROGRAMFILES || ["C:", "Program Files"].join("\\");
const WINDOWS_CANDIDATES = [
  `${pf}\\PostgreSQL\\17\\bin\\pg_dump.exe`,
  `${pf}\\PostgreSQL\\16\\bin\\pg_dump.exe`,
  `${pf}\\PostgreSQL\\15\\bin\\pg_dump.exe`,
  `${pf}\\PostgreSQL\\14\\bin\\pg_dump.exe`,
];

const usrLibPg = ["", "usr", "lib", "postgresql"].join("/");
const LINUX_CANDIDATES = [
  `${usrLibPg}/17/bin/pg_dump`,
  `${usrLibPg}/16/bin/pg_dump`,
  `${usrLibPg}/15/bin/pg_dump`,
  `${usrLibPg}/14/bin/pg_dump`,
  "pg_dump",
];

function pgDumpCandidates(): string[] {
  if (process.platform === "win32") {
    return ["pg_dump", ...WINDOWS_CANDIDATES];
  }
  return LINUX_CANDIDATES;
}

function pgDumpVersion(candidate: string): number | null {
  const result = spawnSync(candidate, ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) return null;
  const match = /pg_dump \(PostgreSQL\) (\d+)/.exec(result.stdout ?? "");
  return match ? Number.parseInt(match[1], 10) : null;
}

export function resolvePgDumpExecutable(): string {
  const fromEnv = process.env.PG_DUMP_PATH?.trim();
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  let best: { path: string; version: number } | null = null;

  for (const candidate of pgDumpCandidates()) {
    if (candidate.includes("/") && !existsSync(candidate)) continue;
    const version = pgDumpVersion(candidate);
    if (version === null || version === undefined) continue;
    if (!best || version > best.version) {
      best = { path: candidate, version };
    }
  }

  if (best) return best.path;

  throw new Error(
    "pg_dump not found. Install PostgreSQL 17 client (Supabase uses PG 17), or set PG_DUMP_PATH.",
  );
}
