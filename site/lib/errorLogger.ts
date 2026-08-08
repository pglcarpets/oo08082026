/**
 * Client-side error logging utility.
 * Sends error stack traces, component stacks, and client environment details
 * to the `/api/log-error` endpoint for ingestion.
 */
export interface LogErrorParams {
  error: Error | unknown;
  label?: string;
  componentStack?: string;
  additionalInfo?: Record<string, unknown>;
}

export async function logClientError({
  error,
  label = "client-utility",
  componentStack = "",
  additionalInfo = {},
}: LogErrorParams): Promise<boolean> {
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Always log to client console first
  console.error(`[${label}] Logging caught error:`, err, componentStack, additionalInfo);

  if (typeof fetch === "undefined") {
    return false;
  }

  try {
    const response = await fetch("/api/log-error", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: err.message || String(err),
        stack: err.stack || "No stack trace provided",
        componentStack,
        url: typeof window !== "undefined" ? window.location.href : "unknown",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        label,
        ...additionalInfo,
      }),
    });

    if (!response.ok) {
      console.warn(`[${label}] Error logger endpoint returned non-ok status: ${response.status}`);
      return false;
    }

    const data = await response.json();
    return !!data.success;
  } catch (errLogging) {
    console.error(`[${label}] Failed to transmit error stack to endpoint:`, errLogging);
    return false;
  }
}
