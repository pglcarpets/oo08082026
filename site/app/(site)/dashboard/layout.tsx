import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/features/site/data/seo";
import { MemberSuiteShell } from "@/features/shared/shell/MemberSuiteShell";
import { requireAuthUser } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * Private member hub — noindex, correct canonical, absolute title
 * (avoids "Dashboard | One&Only | One&Only" from root title template).
 * Session is required at the layout so nested dashboard routes cannot skip auth.
 */
export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Member dashboard | Office furniture workspace",
  description:
    "Signed-in planner workspace for office furniture layouts, saved sessions, portal access, and BOQ handoff. Patna, Ranchi, Bihar and Jharkhand. Not indexed.",
  path: "/dashboard",
  indexable: false,
  alternates: false,
});

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthUser("/dashboard", "planner");
  return <MemberSuiteShell variant="dashboard">{children}</MemberSuiteShell>;
}
