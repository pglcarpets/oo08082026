"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

type QuerySectionScrollProps = {
  /** Query param name whose value matches a section element id (e.g. ?section=imprint). */
  param: string;
};

/**
 * Scrolls to an in-page section when a query param is present.
 * Used for legacy redirects that cannot carry URL fragments through HTTP 308/301.
 */
export function QuerySectionScroll({ param }: QuerySectionScrollProps) {
  const searchParams = useSearchParams();
  const sectionId = searchParams.get(param);

  useEffect(() => {
    if (!sectionId) {
      return;
    }

    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [sectionId]);

  return null;
}
