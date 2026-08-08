import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

import {
  loadBySlug,
  type BlockDescriptor,
} from "@/lib/catalog/svg/svgBlockDescriptorLoader";

// helpers → e2e → tests → monorepo root
const REPO_ROOT = process.cwd();
const SITE_ROOT = path.join(REPO_ROOT, "site");
const TSX_CLI_PATH = createRequire(path.join(REPO_ROOT, "package.json")).resolve(
  "tsx/cli",
);
const WORKER_PATH = path.join(
  REPO_ROOT,
  "tests",
  "e2e",
  "helpers",
  "isolatedAdminSvgPublishWorker.ts",
);
const DEFAULT_WORKER_TIMEOUT_MS = 45_000;

export type IsolatedAdminSvgWorkspaceOptions = {
  readonly workerPath?: string;
  readonly workerTimeoutMs?: number;
};

export type IsolatedPublishResult =
  | { readonly success: true }
  | { readonly success: false; readonly error: string };

export function sha256File(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export type CanonicalSvgPaths = {
  readonly descriptor: string;
  readonly svg: string;
};

export function canonicalSvgPaths(slug: string): CanonicalSvgPaths {
  return {
    descriptor: path.join(SITE_ROOT, "inventory", "descriptors", `${slug}.json`),
    svg: path.join(SITE_ROOT, "public", "assets", "others", "legacy", "svg-catalog", `${slug}.svg`),
  };
}

export type IsolatedAdminSvgWorkspace = {
  readonly root: string;
  readonly descriptorDir: string;
  readonly svgPath: string;
  load(): BlockDescriptor;
  publish(input: unknown): Promise<IsolatedPublishResult>;
  cleanup(): void;
};

export function createIsolatedAdminSvgWorkspace(
  slug: string,
  options: IsolatedAdminSvgWorkspaceOptions = {},
): IsolatedAdminSvgWorkspace {
  const canonical = canonicalSvgPaths(slug);
  if (!existsSync(canonical.descriptor) || !existsSync(canonical.svg)) {
    throw new Error(`Canonical SVG fixture is missing for ${slug}`);
  }

  const root = mkdtempSync(path.join(os.tmpdir(), "oando-admin-svg-"));
  const descriptorDir = path.join(root, "site", "inventory", "descriptors");
  const svgDir = path.join(root, "site", "public", "assets", "others", "legacy", "svg-catalog");
  const svgPath = path.join(svgDir, `${slug}.svg`);
  mkdirSync(descriptorDir, { recursive: true });
  mkdirSync(svgDir, { recursive: true });
  copyFileSync(canonical.descriptor, path.join(descriptorDir, `${slug}.json`));
  copyFileSync(canonical.svg, svgPath);

  return {
    root,
    descriptorDir,
    svgPath,
    load: () => loadBySlug(slug, { dir: descriptorDir }),
    publish: async (input) => {
      const inputPath = path.join(root, "publish-input.json");
      const resultPath = path.join(root, "publish-result.json");
      writeFileSync(inputPath, `${JSON.stringify(input)}\n`, "utf8");
      const run = spawnSync(
        process.execPath,
        [
          TSX_CLI_PATH,
          options.workerPath ?? WORKER_PATH,
          inputPath,
          resultPath,
          root,
          descriptorDir,
        ],
        {
          cwd: REPO_ROOT,
          encoding: "utf8",
          timeout: options.workerTimeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS,
        },
      );
      if (run.error && "code" in run.error && run.error.code === "ETIMEDOUT") {
        throw new Error(
          `Isolated SVG publish worker timed out after ${options.workerTimeoutMs ?? DEFAULT_WORKER_TIMEOUT_MS}ms`,
        );
      }
      if (run.status !== 0) {
        throw new Error(
          `Isolated SVG publish worker failed (${run.status ?? "no exit"}): ${run.error?.message ?? run.stderr ?? run.stdout}`,
        );
      }
      const parsed: unknown = JSON.parse(readFileSync(resultPath, "utf8"));
      if (!parsed || typeof parsed !== "object" || !("success" in parsed)) {
        throw new Error("Isolated SVG publish worker returned an invalid result");
      }
      const candidate = parsed as { success: unknown; error?: unknown };
      return candidate.success === true
        ? { success: true }
        : {
            success: false,
            error:
              typeof candidate.error === "string"
                ? candidate.error
                : "unknown publish failure",
          };
    },
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
