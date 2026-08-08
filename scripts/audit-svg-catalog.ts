/**
 * Census the live admin SVG catalog.
 *
 * Live descriptor identity comes from the production loader. Version snapshots
 * and latest pointers are reported, but never counted as live descriptors.
 */

import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { readSvgArtifactStatus } from "../site/lib/catalog/publish/svgArtifactStatus.server";
import {
  clearLoaderCache,
  loadAll,
} from "../site/lib/catalog/svg/svgBlockDescriptorLoader";
import {
  resolveBlockDescriptorsDir,
  resolveSitePackageRoot,
} from "../site/lib/paths/sitePackageRoot";

const VERSIONED_DESCRIPTOR_RE = /^.+\.\d+\.json$/;
const LATEST_POINTER_RE = /^.+\.latest\.json$/;

function main(): void {
  clearLoaderCache();
  const descriptors = loadAll({ forceReload: true }).sort((left, right) =>
    left.slug.localeCompare(right.slug),
  );
  const liveSlugs = new Set(descriptors.map((descriptor) => descriptor.slug));
  const descriptorEntries = readdirSync(resolveBlockDescriptorsDir());
  const revisionFiles = descriptorEntries
    .filter((entry) => VERSIONED_DESCRIPTOR_RE.test(entry))
    .sort();
  const latestPointers = descriptorEntries
    .filter((entry) => LATEST_POINTER_RE.test(entry))
    .sort();

  const siteRoot = resolveSitePackageRoot();
  const catalogDir = path.join(siteRoot, "public", "assets", "others", "legacy", "svg-catalog");
  const catalogSlugs = readdirSync(catalogDir)
    .filter((entry) => entry.endsWith(".svg"))
    .map((entry) => entry.slice(0, -".svg".length))
    .sort();
  const orphanArtifacts = catalogSlugs.filter((slug) => !liveSlugs.has(slug));

  const artifacts = descriptors.map((descriptor) => {
    const status = readSvgArtifactStatus(descriptor.slug);
    return {
      slug: descriptor.slug,
      descriptorPath: `site/inventory/descriptors/${descriptor.slug}.json`,
      artifactPath: `site/public/assets/others/legacy/svg-catalog/${descriptor.slug}.svg`,
      state: status.state,
      bytes: status.bytes,
      sha256: status.hash,
    };
  });
  const missingOrInvalid = artifacts.filter(
    (artifact) => artifact.state !== "published",
  );
  const ok = missingOrInvalid.length === 0 && orphanArtifacts.length === 0;
  const report = {
    generatedAt: new Date().toISOString(),
    ok,
    counts: {
      liveDescriptors: descriptors.length,
      publishedArtifacts: artifacts.filter(
        (artifact) => artifact.state === "published",
      ).length,
      revisionSnapshotsExcluded: revisionFiles.length,
      latestPointersExcluded: latestPointers.length,
      orphanArtifacts: orphanArtifacts.length,
    },
    artifacts,
    excludedRevisionFiles: revisionFiles,
    excludedLatestPointers: latestPointers,
    orphanArtifacts,
    residuals: ok
      ? []
      : [
          ...missingOrInvalid.map(
            (artifact) => `${artifact.slug}: ${artifact.state}`,
          ),
          ...orphanArtifacts.map((slug) => `${slug}: orphan artifact`),
        ],
  };

  const evidenceDir = path.resolve(
    siteRoot,
    "..",
    "results",
    "planner",
    "admin-svg-pipeline",
  );
  mkdirSync(evidenceDir, { recursive: true });
  const evidencePath = path.join(evidenceDir, "census.json");
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(JSON.stringify(report, null, 2));
  console.log(`SVG catalog census: ${ok ? "PASS" : "FAIL"} -> ${evidencePath}`);
  if (!ok) process.exitCode = 1;
}

main();
