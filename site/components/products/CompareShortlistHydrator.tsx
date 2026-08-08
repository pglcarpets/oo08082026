"use client";

/**
 * If the user lands on /compare without `?items=` but has a local shortlist
 * (from the compare dock), rewrite to the shareable items query so the server
 * page can resolve products. Fixes the audit empty-state when the dock had picks.
 */

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProductCompare } from "@/lib/store/productCompare";

export function CompareShortlistHydrator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useProductCompare((state) => state.items);

  useEffect(() => {
    const raw = searchParams.get("items");
    if (raw && raw.trim().length > 0) {return;}
    if (items.length === 0) {return;}

    const keys = items
      .map((item) => item.productUrlKey || item.id)
      .filter(Boolean)
      .slice(0, 4);
    if (keys.length === 0) {return;}

    const query = encodeURIComponent(keys.join(","));
    router.replace(`/compare?items=${query}`);
  }, [items, router, searchParams]);

  return null;
}
