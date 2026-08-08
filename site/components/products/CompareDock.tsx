"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { GitDiff as GitCompareArrows, Trash as Trash2 } from "@phosphor-icons/react";
import { trackSiteCtaClick } from "@/lib/analytics/siteEvents";
import {
  MAX_COMPARE_ITEMS,
  useProductCompare,
} from "@/lib/store/productCompare";

export function CompareDock() {
  const pathname = usePathname();
  const items = useProductCompare((state) => state.items);
  const clear = useProductCompare((state) => state.clear);

  const query = useMemo(
    () => items.map((item) => item.productUrlKey).filter(Boolean).join(","),
    [items],
  );

  if (items.length === 0 || pathname === "/compare") {return null;}

  return (
    <div
      role="region"
      aria-label="Product comparison shortlist"
      data-compare-dock=""
      className="scheme-panel scheme-border fixed bottom-4 left-1/2 z-40 w-[calc(100%-1rem)] max-w-3xl -translate-x-1/2 rounded-xl border p-3 shadow-theme-float sm:bottom-3"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="typ-body-sm text-body">
            Compare products ({items.length}/{MAX_COMPARE_ITEMS})
          </p>
          <p className="truncate text-sm text-strong">
            {items.map((item) => item.name).join(" | ")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clear}
            aria-label="Clear comparison shortlist"
            className="btn-outline typ-body-sm inline-flex min-h-11 items-center gap-1.5 px-4"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Clear
          </button>
          <Link
            href={query ? `/compare?items=${encodeURIComponent(query)}` : "/compare"}
            onClick={() =>
              trackSiteCtaClick({
                href: query ? `/compare?items=${encodeURIComponent(query)}` : "/compare",
                label: "Compare now",
                pathname: pathname || "",
                surface: "compare-dock",
              })
            }
            className="btn-primary typ-body-sm inline-flex min-h-11 items-center gap-2 px-4"
            aria-label={`Compare ${items.length} selected office furniture products`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
            Compare now
          </Link>
        </div>
      </div>
    </div>
  );
}
