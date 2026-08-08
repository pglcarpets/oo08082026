import Link from "next/link";
import { MEMBER_SUITE_ROUTES } from "@/features/shared/shell/memberSuiteRoutes";

/**
 * Guest portal entry — no auth or storage calls (fast paint for audits).
 */
export default function GuestPortalPageView() {
  return (
    <div
      className="mx-auto flex min-h-[40vh] max-w-xl flex-col items-center justify-center gap-4 py-8 text-center"
      data-testid="guest-portal-page"
    >
      <p className="shell-portal-kicker">Guest portal</p>
      <h1 className="shell-portal-page-title">Browse without an account</h1>
      <p className="page-copy text-body">
        Sign in to load saved plans, or open the workspace planner as a guest.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="shell-portal-button-secondary"
        >
          Sign in
        </Link>
        <Link
          href={MEMBER_SUITE_ROUTES.plannerCanvas}
          className="shell-portal-button-secondary"
        >
          Open planner
        </Link>
      </div>
    </div>
  );
}
