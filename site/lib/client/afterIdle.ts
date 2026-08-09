/**
 * Run work after the browser is idle (or after a short timeout fallback).
 * Used to defer carousels, GSAP, and other non-LCP enhancement work.
 */
export function runAfterIdle(
  task: () => void,
  options?: { timeoutMs?: number },
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const timeoutMs = options?.timeoutMs ?? 2500;
  let cancelled = false;
  let idleId: number | undefined;
  let timerId: number | undefined;

  const run = () => {
    if (cancelled) return;
    task();
  };

  const ric = window.requestIdleCallback?.bind(window);
  if (ric) {
    idleId = ric(run, { timeout: timeoutMs });
  } else {
    timerId = window.setTimeout(run, Math.min(timeoutMs, 1200));
  }

  return () => {
    cancelled = true;
    if (idleId !== undefined && window.cancelIdleCallback) {
      window.cancelIdleCallback(idleId);
    }
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
    }
  };
}

/** First user gesture or idle — whichever comes first. */
export function runAfterIdleOrInteraction(
  task: () => void,
  options?: { timeoutMs?: number },
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    cleanupIdle();
    for (const type of events) {
      window.removeEventListener(type, onInteract, { capture: true });
    }
    task();
  };

  const events = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
  const onInteract = () => finish();
  for (const type of events) {
    window.addEventListener(type, onInteract, { capture: true, passive: true, once: true });
  }

  const cleanupIdle = runAfterIdle(finish, options);

  return () => {
    done = true;
    cleanupIdle();
    for (const type of events) {
      window.removeEventListener(type, onInteract, { capture: true });
    }
  };
}
