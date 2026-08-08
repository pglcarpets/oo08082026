"use client";

import NextError from "next/error";
import { useEffect } from "react";

/**
 * App Router global error boundary (must define its own html/body).
 * Sentry removed 2026-07-09 — use product logging / reportClientError if needed.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    // Keep a console breadcrumb for local/dev diagnosis without third-party RUM.
    console.error("[global-error]", error?.digest ?? error?.message ?? error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* `NextError` requires statusCode; App Router does not expose HTTP status here. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
