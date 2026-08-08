"use client";

import { useEffect } from "react";
import { MarketingCta } from "@/components/ui/MarketingCta";
import { MarketingCtaLink } from "@/components/ui/MarketingCtaLink";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site-error-boundary]", error);
  }, [error]);

  return (
    <div className="site-error" role="alert">
      <div className="site-error__panel">
        <h1 className="site-error__title">Something went wrong</h1>
        <p className="site-error__copy">
          We encountered an unexpected error. Please try again or contact
          support if the issue persists.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <MarketingCta variant="primary" onClick={reset}>
            Try again
          </MarketingCta>
          <MarketingCtaLink
            href="/"
            label="Go to homepage"
            surface="site-error"
            variant="outline"
          >
            Go to homepage
          </MarketingCtaLink>
        </div>
      </div>
    </div>
  );
}
