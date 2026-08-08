import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChooseProductPage } from "@/features/shared/entry/ChooseProductPage";
import { SiteWorkspaceShell } from "@/components/home/layout";
import { getOptionalUser } from "@/lib/auth/session";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";
import { CHOOSE_PRODUCT_PAGE_METADATA } from "@/features/site/data/routeMetadata";

/** Workspace entry — noindex. Real chooser UI; not a bounce to dashboard. */
export const metadata: Metadata = CHOOSE_PRODUCT_PAGE_METADATA;

/** Guest entry that survives post-login return via `next`. Not a page export (Next forbids non-route exports). */
const CHOOSE_PRODUCT_GUEST_PATH = "/choose-product?mode=guest";

export default async function ChooseProductRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const guestMode = resolvedSearchParams?.mode === "guest";

  // Unauthenticated visitors must sign in or pick guest mode.
  // Return them to this chooser (guest), not a bare dashboard redirect.
  if (!user && !guestMode) {
    redirect(buildAccessRedirect(CHOOSE_PRODUCT_GUEST_PATH));
  }

  // Authenticated users stay on the chooser so they can launch planner
  // (or portal). Do not force /dashboard — that hid this route in audits.

  return (
    <SiteWorkspaceShell>
      <Suspense fallback={<div className="min-h-[50vh]" aria-busy="true" />}>
        <ChooseProductPage guestMode={guestMode} authenticated={Boolean(user)} />
      </Suspense>
    </SiteWorkspaceShell>
  );
}
