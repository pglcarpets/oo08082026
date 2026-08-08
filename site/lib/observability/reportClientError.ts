import "server-only";

export type ClientErrorReport = {
  label?: string;
  message?: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
};

function trim(value: string | undefined, max: number): string | undefined {
  if (!value) {return undefined;}
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Structured server-side capture for client errors (console logging). */
export function reportClientError(payload: ClientErrorReport): void {
  const record = {
    label: trim(payload.label, 120) ?? "client",
    url: trim(payload.url, 1024) ?? "Unknown URL",
    userAgent: trim(payload.userAgent, 512) ?? "Unknown UserAgent",
    message: trim(payload.message, 2000) ?? "Unknown error",
    stack: trim(payload.stack, 6000) ?? "No stack trace provided",
    componentStack: payload.componentStack
      ? trim(payload.componentStack, 6000)
      : undefined,
    capturedAt: new Date().toISOString(),
  };

  console.error("[observability] client error", record);
}
