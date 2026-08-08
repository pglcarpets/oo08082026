import { useEffect, useRef, useState, type FormEvent } from "react";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";
import { getAuthSupabaseClient } from "../lib/supabaseClient";
import {
  AuthErrorBanner,
  AuthScreenHeading,
  AuthScreenShell,
} from "./AuthScreenShell";

function humanizeAuthError(error: unknown): string {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "Sign-in failed";
  if (/invalid login credentials/i.test(message)) {
    return "Email or password is incorrect.";
  }
  return message;
}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { error: signInError } =
        await getAuthSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) {
        setError(humanizeAuthError(signInError));
      }
    } catch (caught) {
      setError(humanizeAuthError(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenShell>
      <AuthScreenHeading
        title="Architecture docs"
        subtitle="Admin sign-in required to view the internal tech stack documentation."
      />

      {error ? <AuthErrorBanner message={error} /> : null}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-docs-text-strong">Email</span>
          <input
            ref={emailRef}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={error ? true : undefined}
            className="docs-field w-full rounded-lg border border-docs-border bg-docs-surface px-3 py-2.5 text-sm text-docs-text transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-docs-text-strong">
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            className="docs-field w-full rounded-lg border border-docs-border bg-docs-surface px-3 py-2.5 text-sm text-docs-text transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-inverse transition hover:bg-primary-hover hover:border-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : null}
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-docs-text-subtle">
        Same admin credentials as the main platform.
      </p>
    </AuthScreenShell>
  );
}
