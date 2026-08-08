import type { Metadata, Viewport } from "next";
import "@/app/(site)/globals.css";
import { SITE_VIEWPORT } from "@/lib/siteViewport";

export const metadata: Metadata = {
  title: "Offline | One&Only",
  description: "You are currently offline.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = SITE_VIEWPORT;

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
