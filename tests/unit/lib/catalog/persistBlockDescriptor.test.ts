import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { persistBlockDescriptor } from "@/lib/catalog/persistBlockDescriptor";

describe("persistBlockDescriptor", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "desc-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("writes versioned json and latest pointer", async () => {
    const result = await persistBlockDescriptor({
      dir,
      slug: "test-desk",
      descriptor: { name: "Test Desk" },
      allowedRoots: [dir],
    });
    expect(result.version).toBe(1);
    expect(fs.existsSync(path.join(dir, "test-desk.1.json"))).toBe(true);
    expect(fs.existsSync(path.join(dir, "test-desk.latest.json"))).toBe(true);
    const second = await persistBlockDescriptor({
      dir,
      slug: "test-desk",
      descriptor: { name: "Test Desk 2" },
      allowedRoots: [dir],
    });
    expect(second.version).toBe(2);
  });
});
