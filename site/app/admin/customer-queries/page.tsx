import CustomerQueriesOpsPageView from "@/features/ops/CustomerQueriesOpsPageView";
import { CrmSubnav } from "@/features/crm/CrmSubnav";

export default function AdminCustomerQueriesPage() {
  return (
    <div className="admin-page">
      <CrmSubnav />
      <CustomerQueriesOpsPageView embedded />
    </div>
  );
}
