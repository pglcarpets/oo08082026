import Link from "next/link";
import type { PlannerDocument } from "@planner/lib/plannerDocument";
import { memberSuitePlannerProjectHref } from "@/features/shared/shell/memberSuiteRoutes";

type PortalPlanPageViewProps = {
  document: PlannerDocument | null;
};

export default function PortalPlanPageView({ document }: PortalPlanPageViewProps) {
  if (!document) {
    return (
      <div className="mx-auto min-h-[40vh] max-w-2xl text-center" data-testid="portal-plan-missing">
        <h1 className="shell-portal-page-title">Plan not found</h1>
        <p className="page-copy text-body mt-2">
          This plan is missing or you do not have access.
        </p>
        <Link href="/portal" className="shell-portal-button-primary mt-6">
          Back to portal
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[40vh] max-w-3xl" data-testid="portal-plan-page">
      <Link href="/portal" className="typ-nav text-primary hover:underline">
        ← All plans
      </Link>
      <header className="mt-4 space-y-2">
        <h1 className="shell-portal-page-title">{document.name}</h1>
        <p className="page-copy text-body">
          Status: {document.status}
          {typeof document.itemCount === "number" ? ` · ${document.itemCount} items` : ""}
        </p>
      </header>
      {document.thumbnailUrl ? (
        <img
          src={document.thumbnailUrl}
          alt={`Thumbnail for ${document.name}`}
          className="mt-6 max-h-80 w-full rounded-xl border border-subtle object-contain bg-panel"
        />
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-subtle bg-panel p-12 text-center text-sm text-muted">
          No thumbnail for this plan.
        </div>
      )}
      <div className="mt-6">
        <Link
          href={memberSuitePlannerProjectHref(document.id)}
          className="shell-portal-button-primary"
        >
          Open in planner
        </Link>
      </div>
    </div>
  );
}
