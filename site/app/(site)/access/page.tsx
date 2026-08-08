import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getOptionalUser } from "@/lib/auth/session";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";
import { SiteWorkspaceShell } from "@/components/home/layout";
import { ACCESS_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { AccessSignInView } from "./AccessSignInView";

/**
 * Auth entry: noindex, no hreflang (ACCESS_PAGE_METADATA).
 * Logged-in users hard-redirect via next/navigation (HTTP redirect, not meta-refresh HTML).
 * `next` is path-sanitized — open redirects rejected in sanitizeNextPath.
 */
export const metadata: Metadata = ACCESS_PAGE_METADATA;

export default async function AccessRoute({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawNext =
    typeof resolvedSearchParams?.next === "string"
      ? resolvedSearchParams.next
      : undefined;
  const nextPath = sanitizeNextPath(rawNext);

  if (user) {
    // Server-side redirect only — avoids a11y-critical meta-refresh interstitial.
    redirect(nextPath);
  }

  const guestHref = "/choose-product?mode=guest";
  const requiresAdmin = nextPath === "/admin" || nextPath.startsWith("/admin/");
  const t = await getTranslations("workspace");

  return (
    <SiteWorkspaceShell>
      <AccessSignInView
        backToHomeLabel={t("backToHome")}
        accessPanelTitle={t("accessPanelTitle")}
        accessPanelDescription={t("accessPanelDescription")}
        nextPath={nextPath}
        guestHref={guestHref}
        requiresAdmin={requiresAdmin}
      />
    </SiteWorkspaceShell>
  );
}
