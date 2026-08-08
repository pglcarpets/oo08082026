import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const DEFAULT_POOL_MAX = 1;
const DEFAULT_IDLE_TIMEOUT_SECONDS = 20;
const DEFAULT_CONNECT_TIMEOUT_SECONDS = 10;

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;
  const parsed = Number.parseInt(rawValue, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createPostgresDrizzle(connectionString: string) {
  const client = postgres(connectionString, {
    prepare: false,
    max: readPositiveIntegerEnv("DRIZZLE_POOL_MAX", DEFAULT_POOL_MAX),
    idle_timeout: DEFAULT_IDLE_TIMEOUT_SECONDS,
    connect_timeout: DEFAULT_CONNECT_TIMEOUT_SECONDS,
  });
  return drizzle(client);
}
