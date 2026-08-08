export interface SharedClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface SharedProject {
  id: string;
  name: string;
  clientId: string; // client id or "none"
  status: "active" | "completed" | "on_hold" | "archived";
  notes: string;
  planIds: string[]; // List of planner save IDs
  createdAt: string;
  updatedAt: string;
}

export interface SharedCrmQuoteItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  category: string;
  dimensions?: string;
}

export interface SharedCrmQuote {
  id: string;
  title: string;
  projectId: string;
  clientId: string;
  planId: string;
  items: SharedCrmQuoteItem[];
  totalAmount: number;
  status: "draft" | "sent" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}
