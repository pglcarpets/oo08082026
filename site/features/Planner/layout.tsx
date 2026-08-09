import type { Metadata } from "next";

import "@focss/planner/entry.css";
import TopBar from "@planner/components/PlannerTopBar";
import Toast from "@planner/components/PlannerToast";

export const metadata: Metadata = {
  title: "Planner",
  description:
    "Floor planner — place furniture, review BOQ, and export layouts. Workspace tool; not indexed.",
  robots: { index: false, follow: false },
};

export default function PlannerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main id="main-content" className="ooplanner-root" tabIndex={-1}>
      <div className="app-root">
        <div data-testid="planner-topbar">
          <TopBar />
        </div>
        {children}
        <Toast />
      </div>
    </main>
  );
}
