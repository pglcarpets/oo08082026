"use client";

import { Suspense } from "react";

import type { CompatCategory as Category } from "@/lib/catalog/site/getProducts";

import { AdvancedFilterGridInner } from "./FilterGridInner";

export function FilterGrid({
  category,
  categoryId,
  heroImage,
  subcategoryQuickLinks,
}: {
  category: Category;
  categoryId: string;
  heroImage: { src: string; alt: string };
  subcategoryQuickLinks: readonly string[];
}) {
  return (
    <Suspense
      fallback={
        <div className="text-muted w-full h-64 flex items-center justify-center text-sm">
          Loading products...
        </div>
      }
    >
      <AdvancedFilterGridInner
        category={category}
        categoryId={categoryId}
        heroImage={heroImage}
        subcategoryQuickLinks={subcategoryQuickLinks}
      />
    </Suspense>
  );
}
