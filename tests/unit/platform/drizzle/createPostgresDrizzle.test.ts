// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const postgresMock = vi.fn((..._args: unknown[]) => ({ tag: "sql-client" }));
const drizzleMock = vi.fn((..._args: unknown[]) => ({ client: _args[0], tag: "drizzle" }));

vi.mock("postgres", () => ({
  default: ((...args: unknown[]) => postgresMock(...args)) as never,
}));

vi.mock("drizzle-orm/postgres-js", () => ({
  drizzle: ((...args: unknown[]) => drizzleMock(...args)) as never,
}));

import { createPostgresDrizzle } from "@/platform/drizzle/createPostgresDrizzle";

describe("platform/drizzle/createPostgresDrizzle", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.DRIZZLE_POOL_MAX;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates a postgres client and wraps it with drizzle", () => {
    const result = createPostgresDrizzle("postgres://localhost/test");

    expect(postgresMock).toHaveBeenCalledWith(
      "postgres://localhost/test",
      expect.objectContaining({
        prepare: false,
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
      }),
    );
    expect(drizzleMock).toHaveBeenCalledWith({ tag: "sql-client" });
    expect(result).toEqual({ client: { tag: "sql-client" }, tag: "drizzle" });
  });

  it("uses DRIZZLE_POOL_MAX when it is a positive integer", () => {
    process.env.DRIZZLE_POOL_MAX = "5";
    createPostgresDrizzle("postgres://localhost/test");

    expect(postgresMock).toHaveBeenCalledWith(
      "postgres://localhost/test",
      expect.objectContaining({ max: 5 }),
    );
  });

  it("falls back to default pool max for invalid DRIZZLE_POOL_MAX", () => {
    process.env.DRIZZLE_POOL_MAX = "0";
    createPostgresDrizzle("postgres://localhost/test");

    expect(postgresMock).toHaveBeenCalledWith(
      "postgres://localhost/test",
      expect.objectContaining({ max: 1 }),
    );

    vi.clearAllMocks();
    process.env.DRIZZLE_POOL_MAX = "not-a-number";
    createPostgresDrizzle("postgres://localhost/test");

    expect(postgresMock).toHaveBeenCalledWith(
      "postgres://localhost/test",
      expect.objectContaining({ max: 1 }),
    );
  });
});
