// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(siteRoot, "scripts/general/scan_secrets.mjs");

describe("scan_secrets (name-mirror)", () => {
  it("exits 0 when no secret patterns are present", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scan-secrets-clean-"));
    fs.writeFileSync(path.join(tmp, "readme.txt"), "hello world no secrets here\n", "utf8");
    try {
      const out = execFileSync(process.execPath, [scriptPath], {
        cwd: tmp,
        encoding: "utf8",
      });
      expect(out).toContain("No likely secrets found.");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("exits non-zero when a service-role key assignment is present", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scan-secrets-hit-"));
    fs.writeFileSync(
      path.join(tmp, "leak.env"),
      "SUPABASE_SERVICE_ROLE_KEY=super-secret-value\n",
      "utf8",
    );
    try {
      let code = 0;
      let stderr = "";
      try {
        execFileSync(process.execPath, [scriptPath], {
          cwd: tmp,
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        });
      } catch (err) {
        const e = err as { status?: number; stderr?: string };
        code = e.status ?? 1;
        stderr = e.stderr ?? "";
      }
      expect(code).toBe(1);
      expect(stderr).toMatch(/potential secret/i);
      expect(stderr).toContain("SUPABASE_SERVICE_ROLE_KEY");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("defines ignore set including node_modules and .git", () => {
    const src = fs.readFileSync(scriptPath, "utf8");
    expect(src).toContain("node_modules");
    expect(src).toContain(".git");
    expect(src).toContain('"tests"');
    expect(src).toContain('"generated-documents"');
    expect(src).toContain("sb_secret_");
    expect(src).toContain("OPENAI_API_KEY");
    expect(src).toContain(".env.local");
    expect(src).toContain("isLocalEnvFile");
  });

  it("does not flag local .env.local or empty .env.example assignments", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scan-secrets-env-"));
    fs.writeFileSync(
      path.join(tmp, ".env.local"),
      "SUPABASE_SERVICE_ROLE_KEY=super-secret-value\nOPENAI_API_KEY=sk-real\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmp, ".env.example"),
      "SUPABASE_SERVICE_ROLE_KEY=\nOPENAI_API_KEY=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n",
      "utf8",
    );
    fs.writeFileSync(
      path.join(tmp, "readme.md"),
      "DATABASE_URL=postgresql://...\n",
      "utf8",
    );
    try {
      const out = execFileSync(process.execPath, [scriptPath], {
        cwd: tmp,
        encoding: "utf8",
      });
      expect(out).toContain("No likely secrets found.");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
