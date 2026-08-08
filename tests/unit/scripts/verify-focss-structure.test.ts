// @vitest-environment node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const scriptPath = path.join(monorepoRoot, "scripts/AsNeeded/verify-focss-structure.mjs");

type Fixture = {
  readonly root: string;
  write(relativePath: string, content: string): void;
};

function makeFixture(): Fixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "verify-focss-structure-"));
  const focssRoot = path.join(root, "site", "focss");
  const write = (relativePath: string, content: string) => {
    const target = path.join(focssRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  };

  write("base/scan.css", '@import "tailwindcss";\n@source "../../app/**/*.tsx";\n');
  write("base/runtime.css", '@import "tw-animate-css";\n');
  write("base/document.css", "html {}\n");
  write(
    "base/tokens/palette.css",
    ":root { --color-ecru-100: token; --color-dark-midnight-blue-500: token; --color-white-200: token; }\n",
  );
  write(
    "base/tokens/semantic.css",
    ":root { --surface-page: token; --surface-panel: token; --text-body: token; --border-soft: token; --color-focus: token; --shadow-sm: token; }\n",
  );
  write(
    "base/tokens/layout.css",
    ":root { --space-4: token; --container-max: token; --radius-md: token; --motion-base: token; }\n",
  );
  for (const name of ["typography", "type"]) {
    write(`base/type/${name}.css`, "\n");
  }
  for (const name of ["animations", "containers"]) {
    write(`base/${name}.css`, "\n");
  }
  write(
    "base/index.css",
    [
      '@import "./tokens/palette.css";',
      '@import "./tokens/semantic.css";',
      '@import "./type/typography.css";',
      '@import "./tokens/layout.css";',
      '@import "./type/type.css";',
      '@import "./animations.css";',
      '@import "./containers.css";',
      "",
    ].join("\n"),
  );
  write("base/root.css", '@import "./scan.css";\n@import "./index.css";\n');

  write("site/type-marketing.css", "\n");
  write("site/heading-document.css", "\n");
  write("site/components/shared/index.css", ".site-component {}\n");
  write("site/components/index.css", '@import "./shared/index.css";\n');
  write(
    "site/entry.css",
    [
      '@import "../base/scan.css";',
      '@import "../base/runtime.css";',
      '@import "../base/document.css";',
      '@import "../base/index.css";',
      '@import "./type-marketing.css";',
      '@import "./heading-document.css";',
      '@import "./components/index.css";',
      "",
    ].join("\n"),
  );

  write("admin/base/tokens.css", ".shell-admin-layout {}\n");
  write("admin/base/shell.css", "\n");
  write("admin/base/type.css", "\n");
  write("admin/base/buttons.css", "\n");
  write("admin/base/primitives.css", "\n");
  for (const name of ["pages", "entry-hero", "hub", "catalog", "crm"]) {
    write(`admin/components/${name}.css`, "\n");
  }
  write(
    "admin/entry.css",
    [
      '@import "../base/scan.css";',
      '@import "../base/runtime.css";',
      '@import "../base/index.css";',
      '@import "../base/document.css";',
      '@import "./base/tokens.css";',
      '@import "./base/shell.css";',
      '@import "./base/type.css";',
      '@import "./base/buttons.css";',
      '@import "./base/primitives.css";',
      '@import "./components/pages.css";',
      '@import "./components/entry-hero.css";',
      '@import "./components/hub.css";',
      '@import "./components/catalog.css";',
      '@import "./components/crm.css";',
      "",
    ].join("\n"),
  );
  for (const name of ["palette", "semantic", "layout", "document"]) {
    write(`planner/base/${name}.css`, "\n");
  }
  for (const name of [
    "chrome.css",
    "controls.css",
    "polish.css",
    "workspace-shell.css",
    "workspace.css",
    "dock.css",
  ]) {
    write(`planner/${name}`, "\n");
  }
  write(
    "planner/entry.css",
    [
      '@import "tailwindcss";',
      '@import "../base/tokens/palette.css";',
      '@import "./base/palette.css";',
      '@import "./base/semantic.css";',
      '@import "./base/layout.css";',
      '@import "./base/document.css";',
      '@import "./chrome.css";',
      '@import "./controls.css";',
      '@import "./polish.css";',
      '@import "./workspace-shell.css";',
      '@import "./workspace.css";',
      '@import "./dock.css";',
      "",
    ].join("\n"),
  );

  write("studio/base/index.css", "\n");
  for (const name of [
    "chrome.css",
    "controls.css",
    "polish.css",
    "workspace-shell.css",
    "workspace.css",
    "dock.css",
  ]) {
    write(`studio/${name}`, "\n");
  }
  write(
    "studio/entry.css",
    [
      '@import "../base/scan.css";',
      '@import "../base/runtime.css";',
      '@import "../base/index.css";',
      '@import "../base/document.css";',
      '@import "./base/index.css";',
      '@import "./chrome.css";',
      '@import "./controls.css";',
      '@import "./polish.css";',
      '@import "./workspace-shell.css";',
      '@import "./workspace.css";',
      '@import "./dock.css";',
      "",
    ].join("\n"),
  );

  return { root, write };
}

function run(root: string): string {
  return execFileSync(process.execPath, [scriptPath], {
    cwd: monorepoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FOCSS_STRUCTURE_ROOT: root },
  });
}

function runExpectFail(root: string): string {
  try {
    run(root);
  } catch (error) {
    const result = error as { status?: number; stderr?: string; stdout?: string };
    expect(result.status).toBe(1);
    return `${result.stderr ?? ""}${result.stdout ?? ""}`;
  }
  throw new Error("expected verifier to fail");
}

describe("verify-focss-structure", () => {
  it("accepts a canonical base-first FOCSS tree", () => {
    const fixture = makeFixture();
    try {
      expect(run(fixture.root)).toMatch(/verify-focss-structure: ok/);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects a nested FOCSS package and Site access to Product CSS", () => {
    const fixture = makeFixture();
    try {
      fixture.write("package.json", '{"name":"forbidden"}\n');
      fixture.write("site/components/leak.css", '@import "../../admin/entry.css";\n');
      fixture.write(
        "site/entry.css",
        [
          '@import "../base/scan.css";',
          '@import "../base/runtime.css";',
          '@import "../base/document.css";',
          '@import "../base/index.css";',
          '@import "./type-marketing.css";',
          '@import "./heading-document.css";',
          '@import "./components/index.css";',
          '@import "./components/leak.css";',
          "",
        ].join("\n"),
      );

      const output = runExpectFail(fixture.root);
      expect(output).toContain("forbidden FOCSS path exists: site/focss/package.json");
      expect(output).toContain("site/entry.css must not reach admin/");
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects complete-graph cycles and stylesheets over the hard limit", () => {
    const fixture = makeFixture();
    try {
      fixture.write("admin/a.css", '@import "./b.css";\n');
      fixture.write("admin/b.css", '@import "./a.css";\n');
      fixture.write("admin/oversized.css", ".rule {}\n".repeat(801));

      const output = runExpectFail(fixture.root);
      expect(output).toContain("FOCSS import cycle: admin/a.css -> admin/b.css -> admin/a.css");
      expect(output).toContain("admin/oversized.css exceeds the 800-line FOCSS maximum");
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects raw color literals and Tailwind source declarations outside base", () => {
    const fixture = makeFixture();
    try {
      fixture.write("admin/invalid.css", ".invalid { color: #abcdef; }\n@source " + '"./**/*.tsx";\n');

      const output = runExpectFail(fixture.root);
      expect(output).toContain("admin/invalid.css contains raw color literal #abcdef");
      expect(output).toContain("admin/invalid.css uses @source; only base/scan.css may configure Tailwind sources");
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects flat foundation sheets at base root and loose site component sheets", () => {
    const fixture = makeFixture();
    try {
      fixture.write("base/palette.css", ":root {}\n");
      fixture.write("site/components/buttons.css", "\n");

      const output = runExpectFail(fixture.root);
      expect(output).toContain("forbidden flat base sheet: base/palette.css");
      expect(output).toContain("site/components/buttons.css must live under site/components/shared/");
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("rejects shadcn pack files and document-level Admin token scope", () => {
    const fixture = makeFixture();
    try {
      fixture.write("features/shadcn/theme.css", ":root { --background: var(--surface-card); }\n");
      fixture.write("admin/base/tokens.css", "body:has(.admin-page) {}\n");

      const output = runExpectFail(fixture.root);
      expect(output).toContain("features/shadcn/* must not exist (shadcn pack retired)");
      expect(output).toContain("admin/base/tokens.css must scope Admin overrides to .shell-admin-layout");
      expect(output).toContain("admin/base/tokens.css must not override document-level body tokens");
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});
