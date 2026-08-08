import { redirect } from "next/navigation";
import { DashboardClient } from "@/features/shared/dashboard/DashboardClient";
import { getOptionalUser } from "@/lib/auth/session";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

/**
 * Critical authenticated hub. Metadata lives in layout (noindex + absolute title).
 * Unauthenticated visitors return here after sign-in via sanitized `next`.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();

  if (!user) {
    redirect(buildAccessRedirect("/dashboard"));
  }

  const resolved = searchParams ? await searchParams : {};
  const rawError = resolved.error;
  const accessError =
    (Array.isArray(rawError) ? rawError[0] : rawError)?.trim() || undefined;

  return (
    <DashboardClient
      userEmail={user.email || "workspace user"}
      accessError={accessError}
    />
  );
}
