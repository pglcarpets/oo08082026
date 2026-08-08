import { requireAuthUser } from "@/lib/auth/session";

import PortalPageView from "@/features/site/portal/PortalPageView";
import {
  isMissingOandoPlansTableError,
  isPlannerDatabaseConfigured,
  listPlannerDocumentsFromStore,
  type PlannerSaveSummary,
} from "@planner/lib/projectsStore";

/** Cap plan-list wait so portal never paints an infinite loading spinner. */
const PORTAL_LIST_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Thin route layer: auth + list; view lives under features/site/portal.
export default async function PortalPage() {
  const user = await requireAuthUser("/portal", "planner");
  let databaseConfigured = isPlannerDatabaseConfigured();

  let plans: PlannerSaveSummary[] = [];
  let listError: string | null = null;
  if (databaseConfigured) {
    try {
      plans = await withTimeout(
        listPlannerDocumentsFromStore({ userId: user.id }),
        PORTAL_LIST_TIMEOUT_MS,
        "Portal plan list",
      );
    } catch (error) {
      if (isMissingOandoPlansTableError(error)) {
        databaseConfigured = false;
        plans = [];
        listError = null;
      } else {
        listError =
          error instanceof Error
            ? error.message
            : "Could not load saved plans from storage.";
        plans = [];
      }
    }
  }

  return (
    <PortalPageView
      databaseConfigured={databaseConfigured}
      plans={plans}
      userName={user.name ?? null}
      listError={listError}
    />
  );
}
