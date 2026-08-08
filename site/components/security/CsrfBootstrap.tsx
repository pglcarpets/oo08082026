"use client";

import { useEffect } from "react";

import { ensureCsrfToken } from "@/lib/api/browserApi";

/** Prefetch CSRF token on first paint so mutating API calls do not 403. */
export function CsrfBootstrap() {
  useEffect(() => {
    void ensureCsrfToken().catch(() => {
      // Retry on first mutation via browserApiFetch.
    });
  }, []);

  return null;
}
