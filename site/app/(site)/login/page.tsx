import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";

/**
 * Canonical sign-in route. `/login` is kept as an alias so old bookmarks still work.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = sanitizeNextPath(
    typeof resolvedSearchParams?.next === "string" ? resolvedSearchParams.next : undefined,
  );
  const query = new URLSearchParams({ next: nextPath });
  redirect(`/access?${query.toString()}`);
}
