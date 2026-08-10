import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { buildPageMetadata } from "@/features/site/data/seo";
import { SITE_URL } from "@/lib/siteUrl";
import { sanitizeNextPath } from "@/lib/auth/plannerRedirect";

export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Sign in | One&Only",
  description: "Redirect to workspace sign-in.",
  path: "/login",
  indexable: false,
  alternates: false,
});

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
