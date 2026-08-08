import { ClientsPageView } from "@/features/site/clients/ClientsPageView";
import { CLIENTS_PAGE_METADATA } from "@/features/site/data/routeMetadata";

export const metadata = CLIENTS_PAGE_METADATA;

export default async function ClientsPage() {
  return ClientsPageView();
}
