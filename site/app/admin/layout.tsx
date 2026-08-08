import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "@focss/admin/entry.css";
import AdminLayoutShell from "@/features/admin/ui/AdminLayoutShell";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: {
    default: "Admin | One&Only",
    template: "%s | One&Only Admin",
  },
  description: "One&Only admin console — planner, catalog, CRM, and operations.",
  robots: { index: false, follow: false },
};

/**
 * Admin shell is FOCSS-native (phase 13). ShadcnChrome (tooltip + sonner) is gone.
 * Controls under `@/components/ui/*` and `features/admin/ui/*` are FOCSS + React Aria
 * (no Radix/shadcn registry; orphan deps removed in 13d).
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthUser("/admin", "admin");

  return (
    <NuqsAdapter>
      <AdminLayoutShell>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </AdminLayoutShell>
    </NuqsAdapter>
  );
}
