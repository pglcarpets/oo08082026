/**
 * Compile every block-descriptor to public/assets/others/legacy/svg-catalog/{slug}.svg (maker or blocks path).
 *
 * Run: pnpm --filter oando-site run sync:descriptor-svgs
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { compileSvgForPublish } from "../site/features/planner/asset-engine/svg/compileSvgForPublish";
import { resolveBlockDescriptorsDir, resolvePublicDir } from "../site/lib/paths/sitePackageRoot";
import { clearLoaderCache, loadAll } from "../site/lib/catalog/svg/svgBlockDescriptorLoader";

export async function syncDescriptorSvgs(options: {
  outDir?: string;
  descriptors?: ReturnType<typeof loadAll>;
  forceReload?: boolean;
} = {}): Promise<{ ok: number; fail: number; failures: string[] }> {
  clearLoaderCache();
  const descriptors = options.descriptors ?? loadAll({ forceReload: options.forceReload ?? true });
  const outDir =
    options.outDir ??
    path.join(resolvePublicDir(), "assets", "others", "legacy", "svg-catalog");
  mkdirSync(outDir, { recursive: true });

  let ok = 0;
  let fail = 0;
  const failures: string[] = [];

  for (const descriptor of descriptors) {
    const jsonPath = path.join(resolveBlockDescriptorsDir(), `${descriptor.slug}.json`);
    const raw = JSON.parse(readFileSync(jsonPath, "utf8")) as unknown;
    const result = await compileSvgForPublish(raw);
    if (result.ok === false) {
      console.error(`FAIL ${descriptor.slug}: ${result.error}`);
      fail += 1;
      failures.push(descriptor.slug);
      continue;
    }
    const outPath = path.join(outDir, `${descriptor.slug}.svg`);
    writeFileSync(outPath, `${result.svg}\n`, "utf8");
    console.log(`wrote ${outPath} (${result.stages.join(" → ")})`);
    ok += 1;
  }

  console.log(`sync:descriptor-svgs done ok=${ok} fail=${fail}`);
  return { ok, fail, failures };
}

async function main(): Promise<void> {
  const result = await syncDescriptorSvgs();
  if (result.fail > 0) process.exitCode = 1;
}

const isDirect =
  typeof process !== "undefined" &&
  process.argv[1] &&
  path.resolve(process.argv[1]).includes("sync-descriptor-svgs");

if (isDirect && process.env.NODE_ENV !== "test") {
  void main();
}
