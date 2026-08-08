import type { Metadata } from "next";

import { OfflinePageView } from "@/features/site/offline/OfflinePageView";

export const metadata: Metadata = {
  title: "Offline — Oando Platform",
  description: "You are offline. Cached content is available.",
  robots: { index: false, follow: false },
};

export default async function OfflinePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = searchParams ? await searchParams : undefined;
  const reason = typeof resolved?.reason === "string" ? resolved.reason : undefined;
  const isMaintenance = reason === "maintenance";

  return <OfflinePageView isMaintenance={isMaintenance} />;
}
