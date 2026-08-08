import ProjectDetailView from "@/features/crm/ProjectDetailView";
import { CrmSubnav } from "@/features/crm/CrmSubnav";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCrmProjectDetailPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">CRM</p>
          <h1 className="admin-page__title">Project detail</h1>
          <p className="admin-page__copy">Linked planner documents and client context.</p>
          <p className="admin-page__copy">
            Browser localStorage demo — not a production CRM.
          </p>
        </div>
      </header>
      <CrmSubnav />
      <ProjectDetailView projectId={id} embedded />
    </div>
  );
}
