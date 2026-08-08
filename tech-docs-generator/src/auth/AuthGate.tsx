import type { ReactNode } from "react";
import { CircleNotch as Loader2, ShieldWarning as ShieldX } from "@phosphor-icons/react";
import { isAdminSupabaseConfigured } from "../lib/authEnv";
import { LoginPage } from "./LoginPage";
import { AuthScreenHeading, AuthScreenShell } from "./AuthScreenShell";
import { signOutDocsSession, useSession } from "./AuthProvider";

function LoadingScreen() {
  return (
    <AuthScreenShell compact>
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2
          size={28}
          className="animate-spin text-brand-700"
          aria-hidden
        />
        <p className="text-sm text-docs-text-muted">Checking your session…</p>
      </div>
    </AuthScreenShell>
  );
}

function MissingEnvScreen() {
  return (
    <AuthScreenShell>
      <AuthScreenHeading
        title="Docs auth not configured"
        subtitle="This host needs admin Supabase public credentials at build time."
      />
      <div className="rounded-lg border border-docs-border bg-docs-surface px-4 py-3 text-sm text-docs-text-muted">
        <p className="mb-2">Set these env vars on the docs deploy project:</p>
        <ul className="space-y-1 font-mono text-xs text-docs-text-strong">
          <li>NEXT_ADMIN_SUPABASE_URL</li>
          <li>NEXT_ADMIN_SUPABASE_ANON_KEY</li>
        </ul>
      </div>
    </AuthScreenShell>
  );
}

function AccessDeniedScreen() {
  return (
    <AuthScreenShell>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
        <ShieldX size={24} weight="duotone" aria-hidden />
      </div>
      <AuthScreenHeading
        title="Admin access required"
        subtitle="Your account is signed in but does not have permission to view these docs."
      />
      <button
        type="button"
        onClick={() => {
          void signOutDocsSession();
        }}
        className="inline-flex w-full items-center justify-center rounded-lg border border-docs-border bg-docs-surface px-4 py-2.5 text-sm font-medium text-docs-text-strong transition hover:bg-docs-surface-strong/60"
      >
        Sign out and try another account
      </button>
    </AuthScreenShell>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();

  if (!isAdminSupabaseConfigured()) {
    return <MissingEnvScreen />;
  }

  if (session.status === "loading") {
    return <LoadingScreen />;
  }

  if (session.status === "unauthenticated") {
    return <LoginPage />;
  }

  if (!session.user.isAdmin) {
    return <AccessDeniedScreen />;
  }

  return children;
}
