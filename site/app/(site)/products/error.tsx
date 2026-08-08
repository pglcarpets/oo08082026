"use client";

import { useEffect } from "react";
import { MarketingCta } from "@/components/ui/MarketingCta";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[products-error]", error);
  }, [error]);

  return (
    <div className="site-error">
      <div className="site-error__panel">
        <h1 className="site-error__title">Unable to load products</h1>
        <p className="site-error__copy">
          We&apos;re having trouble loading the product catalog. Please try again.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <MarketingCta variant="primary" onClick={reset}>
            Retry
          </MarketingCta>
          <MarketingCtaLink
            href="/products"
            label="Browse products"
            surface="products-error"
            variant="outline"
          >
            Browse products
          </MarketingCtaLink>
        </div>
      </div>
    </div>
  );
}
