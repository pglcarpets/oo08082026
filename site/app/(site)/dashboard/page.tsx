import { DashboardClient } from "@/features/shared/dashboard/DashboardClient";
import { getOptionalUser } from "@/lib/auth/session";

/**
 * Critical authenticated hub. Metadata + session gate live in layout.
 * Re-reads user for display email (layout already required a session).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getOptionalUser();

  const resolved = searchParams ? await searchParams : {};
  const rawError = resolved.error;
  const accessError =
    (Array.isArray(rawError) ? rawError[0] : rawError)?.trim() || undefined;

  return (
    <DashboardClient
      userEmail={user?.email || "workspace user"}
      accessError={accessError}
    />
  );
}
