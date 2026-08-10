/**
 * Browser localStorage project index for residual CRM plan linking.
 * Live interactive app uses `/api/Planner/projects` (disk or supabase by mode).
 */

export type LocalSavedPlan = {
  id: string;
  name: string;
  furniture: unknown[];
  savedAt?: string;
  key?: string;
};

const INDEX_KEY = "planner_project_index";

function planKey(id: string): string {
  return `planner_${id}`;
}

export function getSavedPlans(): LocalSavedPlan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    const out: LocalSavedPlan[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : null;
      if (!id) continue;
      const key = typeof record.key === "string" ? record.key : planKey(id);
      let furniture: unknown[] = [];
      let savedAt: string | undefined;
      let name =
        typeof record.name === "string" ? record.name : "Untitled local plan";
      try {
        const payloadRaw = localStorage.getItem(key);
        if (payloadRaw) {
          const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
          if (typeof payload.projectName === "string" && payload.projectName) {
            name = payload.projectName;
          }
          if (Array.isArray(payload.furniture)) furniture = payload.furniture;
          if (typeof payload.savedAt === "string") savedAt = payload.savedAt;
        }
      } catch {
        /* corrupt payload — still surface index row */
      }
      out.push({ id, name, furniture, savedAt, key });
    }
    return out;
  } catch {
    return [];
  }
}
