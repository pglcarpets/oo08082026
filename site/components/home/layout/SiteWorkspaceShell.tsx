import type { ReactNode } from "react";

export interface SiteWorkspaceShellProps {
  children: ReactNode;
}

export function SiteWorkspaceShell({ children }: SiteWorkspaceShellProps) {
  return (
    <div data-testid="site-workspace-shell" className="min-h-screen w-full">
      {children}
    </div>
  );
}
