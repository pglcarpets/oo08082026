"use client";

import AdminPlansPageView from "@/features/admin/plans/AdminPlansPageView";

// Thin route layer only. Admin implementation lives in features/admin/.
export default function PlansManagement() {
  return <AdminPlansPageView />;
}
