"use client";

import * as React from "react";
import Link from "next/link";

import { getCustomerSafeAuthError } from "@/lib/auth/customerSafeAuthError";
import { PLANNER_GUEST_COOKIE } from "@/lib/auth/constants";
import { loginWithSupabase } from "@/lib/auth/supabaseServerActions";

interface AccessFormProps {
  nextPath: string;
  guestHref: string;
  requiresAdmin?: boolean;
}

export function AccessForm({ nextPath, guestHref, requiresAdmin = false }: AccessFormProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Do not gate on hasAuthSupabaseEnv() here — that helper reads
    // NEXT_ADMIN_SUPABASE_* (server-only). In the browser bundle those are
    // always missing, so the check falsely aborted before the server action.
    // loginWithSupabase already validates env on the server.
    try {
      const result = await loginWithSupabase(email, password);

      if (!result.success) {
        setIsSubmitting(false);
        setError(result.error || "Login failed");
        return;
      }

      document.cookie = `${PLANNER_GUEST_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      window.location.assign(nextPath);
    } catch (e: unknown) {
      setIsSubmitting(false);
      setError(getCustomerSafeAuthError(e));
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <h1 className="typ-page-title">Welcome to One&Only</h1>
        <p className="mt-3 text-sm text-muted">
          {requiresAdmin
            ? "Sign in with a platform admin account to open the admin console."
            : "Sign in to access your workspace, or continue as a guest to explore."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
        method="post"
        autoComplete="on"
        noValidate={false}
      >
        <label htmlFor="access-email" className="shell-workspace-auth-label">
          <span className="typ-label shell-workspace-auth-label-text">Email</span>
          <input
            id="access-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="you@company.com"
            className="shell-workspace-auth-input text-sm"
          />
        </label>

        <label htmlFor="access-password" className="shell-workspace-auth-label">
          <span className="typ-label shell-workspace-auth-label-text">Password</span>
          <input
            id="access-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Enter your password"
            className="shell-workspace-auth-input text-sm"
          />
        </label>

        {error ? (
          <div
            role="alert"
            aria-live="assertive"
            className="shell-workspace-auth-alert text-sm"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary shell-workspace-auth-submit w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {!requiresAdmin ? (
        <div className="mt-8 border-t border-strong pt-6">
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted">
              Don&apos;t have an account or just looking around?
            </p>
            <Link
              href={guestHref}
              className="btn-outline inline-flex min-h-11 w-full items-center justify-center"
            >
              Continue as Guest
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
