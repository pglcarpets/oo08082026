/**
 * Read a human error string from public API JSON envelopes.
 * Supports legacy `{ error: string }` and current `{ error: { message } }`.
 */
export function readApiErrorMessage(
  body: unknown,
  fallback = "Unable to submit right now.",
): string {
  if (!body || typeof body !== "object") {return fallback;}

  const record = body as Record<string, unknown>;
  const err = record.error;

  if (typeof err === "string") {
    const trimmed = err.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (err && typeof err === "object") {
    const message = (err as Record<string, unknown>).message;
    if (typeof message === "string") {
      const trimmed = message.trim();
      if (trimmed.length > 0) {return trimmed;}
    }
  }

  if (typeof record.message === "string") {
    const trimmed = record.message.trim();
    if (trimmed.length > 0) {return trimmed;}
  }

  return fallback;
}
