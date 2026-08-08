import { redirect } from "next/navigation";
import { buildAccessRedirect } from "@/lib/auth/plannerRedirect";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GuestPortalPlanViewerPage({ params }: PageProps) {
  const { id } = await params;
  redirect(buildAccessRedirect(`/portal/${id}`));
}
