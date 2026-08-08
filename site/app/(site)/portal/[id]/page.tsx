import { requireAuthUser } from "@/lib/auth/session";

import PortalPlanPageView from "@/features/site/portal/PortalPlanPageView";
import { loadPlannerDocumentFromStore } from "@planner/lib/projectsStore";

interface PageProps {
  params: Promise<{ id: string }>;
}

// Thin route layer: auth + load plan; view lives under features/site/portal.
export default async function PortalPlanViewerPage({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await requireAuthUser(`/portal/${resolvedParams.id}`, "planner");
  const plan = await loadPlannerDocumentFromStore(resolvedParams.id, user.id);
  return <PortalPlanPageView document={plan} />;
}
