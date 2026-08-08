import type { Metadata } from "next";
import GuestPortalPageView from "@/features/site/portal/GuestPortalPageView";

export const metadata: Metadata = {
  title: "Guest portal | One&Only",
  robots: { index: false, follow: false },
};

/**
 * Guest portal entry — renders immediately.
 * Does not call auth or planner storage (those hung audits on infinite loading).
 */
export default function GuestPortalPage() {
  return <GuestPortalPageView />;
}
