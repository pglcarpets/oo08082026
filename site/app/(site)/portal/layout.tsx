import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildPageMetadata } from "@/features/site/data/seo";
import { PortalShell } from "@/features/site/portal/PortalShell";
import { SITE_URL } from "@/lib/siteUrl";

/** Absolute title — avoids "Portal | One&Only | One&Only" from root title template. */
export const metadata: Metadata = buildPageMetadata(SITE_URL, {
  title: "Portal",
  description:
    "Signed-in portal for planner access and workspace tools. Not indexed.",
  path: "/portal",
  indexable: false,
  alternates: false,
});

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
