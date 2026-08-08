/**
 * Isolated P0 publish worker — same compile authority as storage publish,
 * writes only into the temp workspace (never canonical catalog).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { compileSvgForPublish } from "@/features/planner/asset-engine/svg/compileSvgForPublish";
import {
  parseAdminPayload,
  persistBlockDescriptor,
} from "@/features/admin/product-studio/storage/persistBlockDescriptor";
import {
  assertCatalogWriteAllowed,
} from "@/features/admin/product-studio/storage/catalogWriteIsolation";

async function main(): Promise<void> {
  const [inputPath, resultPath, projectRoot, descriptorDir] = process.argv.slice(2);

  if (!inputPath || !resultPath || !projectRoot || !descriptorDir) {
    throw new Error("isolated publish worker requires input, result, root, and descriptor paths");
  }

  const input: unknown = JSON.parse(readFileSync(inputPath, "utf8"));
  const parsed = parseAdminPayload(input);
  if (!parsed.ok) {
    writeFileSync(
      resultPath,
      `${JSON.stringify({ success: false, error: `${parsed.error.code}: ${parsed.error.message}` })}\n`,
      "utf8",
    );
    process.exitCode = 2;
    return;
  }

  const descriptor = parsed.value;
  const compiled = await compileSvgForPublish(descriptor);
  if (!compiled.ok) {
    writeFileSync(
      resultPath,
      `${JSON.stringify({
        success: false,
        error: `compile_failed: ${compiled.error} (at ${compiled.failedAt})`,
      })}\n`,
      "utf8",
    );
    process.exitCode = 2;
    return;
  }

  const svgPath = path.join(
    projectRoot,
    "site",
    "public",
    "svg-catalog",
    `${descriptor.slug}.svg`,
  );
  try {
    assertCatalogWriteAllowed(svgPath);
  } catch (error) {
    writeFileSync(
      resultPath,
      `${JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
      "utf8",
    );
    process.exitCode = 2;
    return;
  }

  mkdirSync(path.dirname(svgPath), { recursive: true });
  writeFileSync(svgPath, compiled.svg, "utf8");

  const persist = persistBlockDescriptor(descriptor, { dir: descriptorDir });
  if (!persist.ok) {
    writeFileSync(
      resultPath,
      `${JSON.stringify({
        success: false,
        error: `${persist.error.code}: ${persist.error.message}`,
      })}\n`,
      "utf8",
    );
    process.exitCode = 2;
    return;
  }

  writeFileSync(
    resultPath,
    `${JSON.stringify({ success: true, descriptor: persist.descriptor })}\n`,
    "utf8",
  );
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const resultPath = process.argv[3];
  if (resultPath) {
    writeFileSync(
      resultPath,
      `${JSON.stringify({ success: false, error: message })}\n`,
      "utf8",
    );
  }
  process.exitCode = 2;
});
