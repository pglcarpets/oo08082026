import QuotesView from "@/features/crm/QuotesView";
import { CrmSubnav } from "@/features/crm/CrmSubnav";

export const dynamic = "force-dynamic";

export default function AdminCrmQuotesPage() {
  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <p className="admin-page__eyebrow">CRM</p>
          <h1 className="admin-page__title">Quotes</h1>
          <p className="admin-page__copy">
            Quote drafts, approvals, and follow-up status. Browser localStorage demo — not a
            production CRM.
          </p>
        </div>
      </header>
      <CrmSubnav />
      <QuotesView embedded />
    </div>
  );
}
