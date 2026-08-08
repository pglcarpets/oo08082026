import { COMPARE_PAGE_METADATA } from "@/features/site/data/routeMetadata";
import { ComparePageView } from "@/features/site/compare/ComparePageView";

export const metadata = COMPARE_PAGE_METADATA;

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return ComparePageView({ searchParams });
}
