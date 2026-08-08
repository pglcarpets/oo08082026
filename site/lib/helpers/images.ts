import { normalizeAssetPath } from "@/lib/assetPaths";

export function normalizeImageSource(source: string | null | undefined): string {
  return normalizeAssetPath(source, { probeDisk: true });
}

export { normalizeAssetPath } from "@/lib/assetPaths";
