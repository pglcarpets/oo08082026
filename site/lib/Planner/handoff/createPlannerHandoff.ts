/**
 * Planner BOQ handoff — persist to admin Supabase `planner_handoffs`.
 * Inject a store for unit tests; default store uses service-role admin client.
 */

import type { Json } from "@/platform/supabase/types";
import type { PlannerHandoffRequest } from "./handoffSchema";

export type CreatePlannerHandoffSuccess = {
  ok: true;
  referenceId: string;
  createdAt: string;
  idempotentReplay: boolean;
  message: string;
};

export type CreatePlannerHandoffFailure = {
  ok: false;
  kind: "persist_failed" | "not_configured";
  message: string;
  code: string;
};

export type CreatePlannerHandoffResult =
  | CreatePlannerHandoffSuccess
  | CreatePlannerHandoffFailure;

export type StoredHandoff = {
  referenceId: string;
  createdAt: string;
  request: PlannerHandoffRequest;
};

/** Persistence port — swap for tests or alternate stores. */
export type HandoffStore = {
  findByIdempotencyKey: (key: string) => Promise<StoredHandoff | null>;
  insert: (row: StoredHandoff & { createdBy?: string | null }) => Promise<void>;
};

function newReferenceId(): string {
  return `HO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** In-memory store (unit tests — pass explicitly via options.store). */
export function createMemoryHandoffStore(
  seed: Map<string, StoredHandoff> = new Map(),
): HandoffStore {
  return {
    async findByIdempotencyKey(key) {
      return seed.get(key) ?? null;
    },
    async insert(row) {
      seed.set(row.request.idempotencyKey, {
        referenceId: row.referenceId,
        createdAt: row.createdAt,
        request: row.request,
      });
    },
  };
}

const testMemoryMap = new Map<string, StoredHandoff>();

/** Test helper — clear default in-memory map used when useMemoryFallback is set. */
export function __resetHandoffStoreForTests(): void {
  testMemoryMap.clear();
}

function isAuthAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_ADMIN_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY?.trim(),
  );
}

/**
 * Supabase-backed store (service role). Dynamic import keeps unit tests free of
 * server-only auth-admin when they inject a memory store.
 */
export async function createSupabaseHandoffStore(): Promise<HandoffStore> {
  const { createSupabaseAuthAdminClient } = await import(
    "@/platform/supabase/auth-admin"
  );
  const client = createSupabaseAuthAdminClient();

  return {
    async findByIdempotencyKey(key) {
      const { data, error } = await client
        .from("planner_handoffs")
        .select(
          "reference_id, created_at, contact, boq, project_notes, idempotency_key",
        )
        .eq("idempotency_key", key)
        .maybeSingle();
      if (error) {
        throw new Error(error.message);
      }
      if (!data) return null;
      return {
        referenceId: data.reference_id,
        createdAt: data.created_at,
        request: {
          contact: data.contact as PlannerHandoffRequest["contact"],
          boq: data.boq as PlannerHandoffRequest["boq"],
          idempotencyKey: data.idempotency_key,
          projectNotes: data.project_notes ?? undefined,
        },
      };
    },
    async insert(row) {
      const { error } = await client.from("planner_handoffs").insert({
        reference_id: row.referenceId,
        idempotency_key: row.request.idempotencyKey,
        project_id: row.request.boq.projectId,
        project_name: row.request.boq.projectName,
        calculation_hash: row.request.boq.calculationHash,
        contact: row.request.contact as unknown as Json,
        // Supabase Json column — boq lines are Record<string, unknown>[], not Json[].
        boq: row.request.boq as unknown as Json,
        project_notes: row.request.projectNotes ?? null,
        status: "new",
        created_by: row.createdBy ?? null,
        created_at: row.createdAt,
        updated_at: row.createdAt,
      });
      if (error) {
        throw Object.assign(new Error(error.message), {
          code: error.code ?? "insert_failed",
        });
      }
    },
  };
}

export type CreatePlannerHandoffOptions = {
  store?: HandoffStore;
  /** When true and no store passed, use process-local memory (tests only). */
  useMemoryFallback?: boolean;
  createdBy?: string | null;
};

export async function createPlannerHandoff(
  request: PlannerHandoffRequest,
  options: CreatePlannerHandoffOptions = {},
): Promise<CreatePlannerHandoffResult> {
  let store = options.store;
  if (!store) {
    if (options.useMemoryFallback) {
      store = createMemoryHandoffStore(testMemoryMap);
    } else if (isAuthAdminConfigured()) {
      try {
        store = await createSupabaseHandoffStore();
      } catch (e) {
        return {
          ok: false,
          kind: "not_configured",
          code: "handoff_not_configured",
          message:
            e instanceof Error
              ? e.message
              : "Admin Supabase client could not be created",
        };
      }
    } else {
      return {
        ok: false,
        kind: "not_configured",
        code: "handoff_not_configured",
        message:
          "Handoff persistence is not configured (missing NEXT_ADMIN_SUPABASE_URL / SUPABASE_ADMIN_SERVICE_ROLE_KEY).",
      };
    }
  }

  try {
    const existing = await store.findByIdempotencyKey(request.idempotencyKey);
    if (existing) {
      return {
        ok: true,
        referenceId: existing.referenceId,
        createdAt: existing.createdAt,
        idempotentReplay: true,
        message: "Handoff already recorded (idempotent replay).",
      };
    }

    const referenceId = newReferenceId();
    const createdAt = new Date().toISOString();
    const row: StoredHandoff = { referenceId, createdAt, request };

    try {
      await store.insert({ ...row, createdBy: options.createdBy ?? null });
    } catch (e) {
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code: unknown }).code)
          : "";
      if (code === "23505" || /duplicate|unique/i.test(String(e))) {
        const raced = await store.findByIdempotencyKey(request.idempotencyKey);
        if (raced) {
          return {
            ok: true,
            referenceId: raced.referenceId,
            createdAt: raced.createdAt,
            idempotentReplay: true,
            message: "Handoff already recorded (idempotent replay).",
          };
        }
      }
      throw e;
    }

    return {
      ok: true,
      referenceId,
      createdAt,
      idempotentReplay: false,
      message: `Handoff ${referenceId} recorded for staff follow-up.`,
    };
  } catch (e) {
    return {
      ok: false,
      kind: "persist_failed",
      code: "handoff_persist_failed",
      message: e instanceof Error ? e.message : "Failed to persist handoff",
    };
  }
}
