"use client";


import Image from "next/image";
import { useState } from "react";

type PreviewState = "empty" | "loading" | "ok" | "broken" | "unsupported";

function classifyAssetUrl(raw: string): { href: string; kind: "image" | "unsupported" | "empty" } {
  const href = raw.trim();
  if (!href) {
    return { href: "", kind: "empty" };
  }

  const lower = href.toLowerCase();
  if (
    lower.endsWith(".glb") ||
    lower.endsWith(".gltf") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.includes(".glb?") ||
    lower.includes(".gltf?")
  ) {
    return { href, kind: "unsupported" };
  }

  return { href, kind: "image" };
}

const STATUS_COPY: Record<PreviewState, string> = {
  empty: "No URL yet — preview appears when a reachable image URL is set.",
  loading: "Loading preview…",
  ok: "Preview loaded from the URL above.",
  broken: "Preview failed — URL is missing, blocked, or not an image.",
  unsupported: "Not an image preview (3D/video URLs stay as text only).",
};

type Props = {
  url: string;
  label: string;
};

type LoadResult = { href: string; status: "loading" | "ok" | "broken" };

/** Honest catalog media preview — checkerboard frame, no decorative loops. */
export function AdminCatalogAssetPreview({ url, label }: Props) {
  const classified = classifyAssetUrl(url);
  const [loadResult, setLoadResult] = useState<LoadResult>({
    href: classified.href,
    status: "loading",
  });

  // The URL changed since the last render — reset the image load status now,
  // during render, instead of in an Effect (avoids an extra cascading render
  // and a one-frame flash of the previous URL's stale ok/broken status text).
  const currentLoadResult =
    loadResult.href === classified.href
      ? loadResult
      : { href: classified.href, status: "loading" as const };
  if (currentLoadResult !== loadResult) {
    setLoadResult(currentLoadResult);
  }

  const state: PreviewState =
    classified.kind === "empty"
      ? "empty"
      : classified.kind === "unsupported"
        ? "unsupported"
        : currentLoadResult.status;

  const tone = state === "broken" ? "danger" : undefined;

  return (
    <div className="admin-asset-preview" data-testid="admin-catalog-asset-preview">
      <div
        className="admin-asset-preview__frame"
        data-state={state}
        role="img"
        aria-label={`${label} preview`}
      >
        {classified.kind === "image" && state !== "broken" ? (
          // Operator-supplied URL: never route an arbitrary host through the
          // image optimizer — render the bytes as given and probe load state.
          <Image
            key={classified.href}
            src={classified.href}
            alt=""
            fill
            unoptimized
            sizes="14rem"
            className="admin-asset-preview__image"
            onLoad={() => setLoadResult({ href: classified.href, status: "ok" })}
            onError={() => setLoadResult({ href: classified.href, status: "broken" })}
          />
        ) : null}
      </div>
      <p className="admin-asset-preview__status" data-tone={tone} role="status">
        {STATUS_COPY[state]}
      </p>
    </div>
  );
}
