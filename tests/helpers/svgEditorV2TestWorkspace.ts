import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";

import type { SvgAssetManifestV2 } from "@/features/admin/product-studio-v2/model/svgAssetManifestV2";
import {
  SupabaseSvgDraftStorage,
  type SvgStorageDriverV2,
} from "@/features/admin/product-studio-v2/persistence/svgDraftStorage";
import {
  SvgAssetRepositoryV2,
  type SvgAssetRepositoryV2Persistence,
} from "@/features/admin/product-studio-v2/persistence/svgAssetRepositoryV2.server";
import { R2SvgReleaseStorage } from "@/features/admin/product-studio-v2/persistence/svgReleaseStorage";

const SITE_ROOT = path.resolve(__dirname, "../..");

export const CANONICAL_DESCRIPTOR_DIR = path.join(SITE_ROOT, "inventory", "descriptors");
export const CANONICAL_SVG_CATALOG_DIR = path.join(SITE_ROOT, "public", "assets", "others", "legacy", "svg-catalog");

export interface SvgEditorV2TestRepositories {
  readonly manifests: Map<string, SvgAssetManifestV2>;
  readonly publishedVersions: Map<string, SvgAssetManifestV2>;
}

export interface SvgEditorV2TestWorkspace {
  readonly root: string;
  readonly draftDir: string;
  readonly releaseDir: string;
  readonly assetRepository: SvgAssetRepositoryV2;
  resolvePath(candidate: string): string;
  cleanup(): void;
}

function isWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function fileStorageDriver(baseDir: string): SvgStorageDriverV2 {
  const mimeTypes = new Map<string, string>();
  const resolveKey = (key: string): string => {
    const resolved = path.resolve(baseDir, key);
    if (!isWithin(baseDir, resolved)) throw new Error(`Test storage key escapes workspace: ${key}`);
    return resolved;
  };
  return {
    async put(key, body, mimeType) {
      const filePath = resolveKey(key);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, body);
      mimeTypes.set(key, mimeType);
    },
    async get(key) {
      const filePath = resolveKey(key);
      if (!existsSync(filePath)) return null;
      const body = new Uint8Array(readFileSync(filePath));
      return {
        body,
        mimeType: mimeTypes.get(key) ?? "application/octet-stream",
        contentLength: body.byteLength,
      };
    },
    async remove(key) {
      const filePath = resolveKey(key);
      if (existsSync(filePath)) unlinkSync(filePath);
      mimeTypes.delete(key);
    },
  };
}

export function createSvgEditorV2TestWorkspace(
  repositories: SvgEditorV2TestRepositories,
): SvgEditorV2TestWorkspace {
  const root = mkdtempSync(path.join(os.tmpdir(), "oando-svg-editor-v2-"));
  const draftDir = path.join(root, "supabase-private");
  const releaseDir = path.join(root, "r2-public");
  mkdirSync(draftDir, { recursive: true });
  mkdirSync(releaseDir, { recursive: true });

  const persistence: SvgAssetRepositoryV2Persistence = {
    async loadManifest(assetId) {
      return repositories.manifests.get(assetId) ?? null;
    },
    async compareAndSwapManifest(input) {
      const current = repositories.manifests.get(input.assetId);
      if (
        !current ||
        current.currentVersion !== input.expectedVersion ||
        current.sourceChecksum !== input.expectedChecksum
      ) return false;
      repositories.manifests.set(input.assetId, input.next);
      return true;
    },
  };
  const draftStorage = new SupabaseSvgDraftStorage(fileStorageDriver(draftDir), "test-private");
  const releaseStorage = new R2SvgReleaseStorage(fileStorageDriver(releaseDir), "test-public");
  const assetRepository = new SvgAssetRepositoryV2(persistence, {
    draftStorage,
    releaseStorage,
    publishPersistence: {
      async commitPublishedVersion(input) {
        const key = `${input.manifest.assetId}:${input.manifest.currentVersion}`;
        const existing = repositories.publishedVersions.get(key);
        if (existing) {
          if (existing.sourceChecksum !== input.manifest.sourceChecksum) {
            throw new Error("immutable test revision checksum conflict");
          }
          return "already-committed";
        }
        const current = repositories.manifests.get(input.manifest.assetId);
        if (
          !current ||
          current.currentVersion !== input.expectedVersion ||
          current.sourceChecksum !== input.expectedChecksum
        ) throw new Error("test repository concurrency conflict");
        repositories.publishedVersions.set(key, input.manifest);
        repositories.manifests.set(input.manifest.assetId, input.manifest);
        return "committed";
      },
    },
  });

  const resolvePath = (candidate: string): string => {
    const resolved = path.resolve(root, candidate);
    if (!isWithin(root, resolved)) {
      throw new Error(`Path is outside isolated SVG editor V2 workspace: ${resolved}`);
    }
    return resolved;
  };

  return {
    root,
    draftDir,
    releaseDir,
    assetRepository,
    resolvePath,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

export async function withSvgEditorV2TestWorkspace<Result>(
  repositories: SvgEditorV2TestRepositories,
  callback: (workspace: SvgEditorV2TestWorkspace) => Promise<Result> | Result,
): Promise<Result> {
  const workspace = createSvgEditorV2TestWorkspace(repositories);
  try {
    return await callback(workspace);
  } finally {
    workspace.cleanup();
  }
}
