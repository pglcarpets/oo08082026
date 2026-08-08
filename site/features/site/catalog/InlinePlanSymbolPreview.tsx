"use client";

import { cn } from "@/lib/utils";

type InlinePlanSymbolPreviewProps = {
  url: string;
  label: string;
  size?: "panel" | "thumb";
  className?: string;
};

/**
 * Marketing PDP plan-symbol thumb. PNG preferred; SVG allowed as legacy read.
 */
export function InlinePlanSymbolPreview({
  url,
  label,
  size = "panel",
  className,
}: InlinePlanSymbolPreviewProps) {
  return (
    <img
      src={url}
      alt={label}
      className={cn(
        "block max-w-full bg-panel object-contain",
        size === "panel" ? "h-40 w-full" : "h-16 w-16",
        className,
      )}
      data-testid="inline-plan-symbol-preview"
      loading="lazy"
      decoding="async"
    />
  );
}
