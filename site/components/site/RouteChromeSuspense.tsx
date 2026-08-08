import { Suspense } from "react";

import { RouteChrome } from "@/components/site/RouteChrome";
import { SiteConversionTracker } from "@/components/site/SiteConversionTracker";

/** RouteChrome uses useSearchParams — must sit inside a Suspense boundary. */
export function RouteChromeSuspense({
  position,
}: {
  position: "top" | "bottom";
}) {
  return (
    <Suspense fallback={null}>
      {position === "top" ? <SiteConversionTracker /> : null}
      <RouteChrome position={position} />
    </Suspense>
  );
}