import ClientsView from "@/features/crm/ClientsView";
import { CrmSubnav } from "@/features/crm/CrmSubnav";

export const dynamic = "force-dynamic";

export default function AdminCrmClientsPage() {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">CRM</p>
          <h1 className="admin-page__title">Clients</h1>
          <p className="admin-page__copy">
            Client records, contact context, and linked projects. Browser localStorage demo —
            not a production CRM.
          </p>
        </div>
      </header>
      <CrmSubnav />
      <ClientsView embedded />
    </div>
  );
}
