import Link from "next/link";
import { MEMBER_SUITE_ROUTES } from "@/features/shared/shell/memberSuiteRoutes";

export type PortalPlanListItem = {
  id: string;
  name: string;
  item_count: number;
  updated_at: string;
};

type PortalPageViewProps = {
  databaseConfigured: boolean;
  plans: PortalPlanListItem[];
  userName?: string | null;
  listError?: string | null;
};

export default function PortalPageView({
  databaseConfigured,
  plans,
  userName,
  listError,
}: PortalPageViewProps) {
  return (
    <div className="mx-auto w-full max-w-4xl" data-testid="portal-page">
      <header className="mb-8 space-y-2">
        <p className="shell-portal-kicker">Portal</p>
        <h1 className="shell-portal-page-title">
          {userName ? `${userName}'s plans` : "Your plans"}
        </h1>
        <p className="page-copy text-body">
          Saved floor plans from the workspace planner (disk store).
        </p>
      </header>

      {!databaseConfigured ? (
        <p className="rounded-xl border border-subtle bg-panel p-6 text-sm text-muted" role="status">
          Plan storage is not configured in this environment.
        </p>
      ) : null}

      {listError ? (
        <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger" role="alert">
          {listError}
        </p>
      ) : null}

      {databaseConfigured && plans.length === 0 && !listError ? (
        <div className="rounded-xl border border-subtle bg-panel p-8 text-center">
          <p className="font-medium text-strong">No saved plans yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a plan in the workspace planner, then return here.
          </p>
          <Link
            href={MEMBER_SUITE_ROUTES.plannerCanvas}
            className="shell-portal-button-primary mt-4"
          >
            Open planner
          </Link>
        </div>
      ) : null}

      {plans.length > 0 ? (
        <ul className="divide-y divide-subtle rounded-xl border border-subtle bg-panel">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link
                href={`/portal/${encodeURIComponent(plan.id)}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-soft"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-strong">{plan.name}</p>
                  <p className="text-xs text-muted">
                    {plan.item_count} items · updated{" "}
                    {new Date(plan.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">View</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
