"use client";

import { useCallback, useEffect, useRef } from "react";

type PendingSave<T> = { draft: T; revision: number };

export type UseStudioDraftAutosaveOptions<T> = {
  draft: T | null;
  revision: number;
  enabled?: boolean;
  delayMs?: number;
  save: (draft: T, expectedRevision: number) => Promise<{ ok: true } | { ok: false; conflict?: boolean }>;
  onSaved: () => void;
  onConflict: () => void;
  onError: (error: Error) => void;
};

/** Queues newest dirty revision while exactly one save is in flight. */
export function useStudioDraftAutosave<T>({
  draft,
  revision,
  enabled = true,
  delayMs = 10_000,
  save,
  onSaved,
  onConflict,
  onError,
}: UseStudioDraftAutosaveOptions<T>) {
  const inFlight = useRef(false);
  const pending = useRef<PendingSave<T> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (inFlight.current) return;
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    inFlight.current = true;
    try {
      const result = await save(job.draft, job.revision);
      if (result.ok) onSaved();
      else if (result.conflict) onConflict();
      else onError(new Error("Save failed"));
    } catch (e) {
      onError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      inFlight.current = false;
      if (pending.current) void flush();
    }
  }, [save, onSaved, onConflict, onError]);

  useEffect(() => {
    if (!enabled || draft === null) return;
    pending.current = { draft, revision };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void flush();
    }, delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [draft, revision, enabled, delayMs, flush]);
}
