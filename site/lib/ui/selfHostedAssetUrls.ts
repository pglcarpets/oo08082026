/** Local paths under public/assets/others/legacy/cdn (compat rewrite also serves /cdn/*). */
export const MODEL_VIEWER_SCRIPT = {
  local: "/assets/others/legacy/cdn/vendor/model-viewer@4.3.1/model-viewer.min.js",
  cdn: "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js",
} as const;

export const MODEL_VIEWER_DRACO = {
  localProbe: "/assets/others/legacy/cdn/vendor/draco/1.5.6/draco_wasm_wrapper.js",
  localDir: "/assets/others/legacy/cdn/vendor/draco/1.5.6/",
  cdnDir: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
} as const;

export const MODEL_VIEWER_KTX2 = {
  localProbe:
    "/assets/others/legacy/cdn/vendor/basis-universal/2021-04-15-ba1c3e4/basis_transcoder.wasm",
  localDir: "/assets/others/legacy/cdn/vendor/basis-universal/2021-04-15-ba1c3e4/",
  cdnDir: "https://www.gstatic.com/basis-universal/versioned/2021-04-15-ba1c3e4/",
} as const;

async function isReachable(url: string): Promise<boolean> {
  try {
    const headResponse = await fetch(url, { method: "HEAD" });
    if (headResponse.ok) {
      return true;
    }
  } catch {
    // try GET below
  }

  try {
    const getResponse = await fetch(url, { method: "GET", cache: "force-cache" });
    return getResponse.ok;
  } catch {
    return false;
  }
}

export async function resolveSelfHostedAssetUrl(
  localPath: string,
  cdnFallbackUrl: string,
): Promise<string> {
  if (typeof window === "undefined") {
    return localPath;
  }

  if (await isReachable(localPath)) {
    return localPath;
  }

  return cdnFallbackUrl;
}

export async function resolveSelfHostedAssetDir(
  localProbeFile: string,
  localDir: string,
  cdnDir: string,
): Promise<string> {
  const probeName = localProbeFile.split("/").pop() ?? "";
  const normalizedCdnDir = cdnDir.endsWith("/") ? cdnDir : `${cdnDir}/`;
  const cdnProbeFile = `${normalizedCdnDir}${probeName}`;
  const resolvedProbe = await resolveSelfHostedAssetUrl(localProbeFile, cdnProbeFile);

  if (resolvedProbe === localProbeFile) {
    return localDir;
  }

  return normalizedCdnDir;
}

export async function resolveModelViewerDecoderUrls(): Promise<{
  dracoDir: string;
  ktx2Dir: string;
}> {
  const [dracoDir, ktx2Dir] = await Promise.all([
    resolveSelfHostedAssetDir(
      MODEL_VIEWER_DRACO.localProbe,
      MODEL_VIEWER_DRACO.localDir,
      MODEL_VIEWER_DRACO.cdnDir,
    ),
    resolveSelfHostedAssetDir(
      MODEL_VIEWER_KTX2.localProbe,
      MODEL_VIEWER_KTX2.localDir,
      MODEL_VIEWER_KTX2.cdnDir,
    ),
  ]);

  return { dracoDir, ktx2Dir };
}