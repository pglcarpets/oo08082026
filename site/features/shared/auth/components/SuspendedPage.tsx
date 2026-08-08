import Link from 'next/link'
import { ShieldWarning as ShieldAlert } from "@phosphor-icons/react"
import { AuthShell } from './AuthShell'

/**
 * Landing page a user is routed to when their sign-in fails because
 * their account is suspended (Supabase Auth's `banned_until` is set).
 * Without this page, a banned user would either:
 *   - See a raw "User is banned until …" error inline on the login
 *     form (alarming), or
 *   - Bounce silently to /login again on a refresh-token failure
 *     (mysterious).
 *
 * We deliberately don't surface the suspension *reason* here. Reading
 * it would require either a public unauthenticated lookup (which
 * leaks user existence) or letting the suspended user authenticate
 * (which the suspension is supposed to prevent). The reason is
 * recorded in the audit trail and visible to admins; the user's
 * recourse is to contact their administrator out of band.
 */
export function SuspendedPage() {
  return (
    <AuthShell documentTitle="Account suspended">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-danger dark:bg-red-950/40 dark:text-red-400">
          <ShieldAlert size={22} aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-heading dark:text-foreground">
          Your account is suspended
        </h1>
        <p className="mt-3 text-ui-13 text-muted dark:text-inverse-muted">
          A platform administrator has temporarily blocked sign-in for
          your account. Your data and team memberships are preserved
          and will be available again if the suspension is lifted.
        </p>
        <p className="mt-3 text-ui-13 text-muted dark:text-inverse-muted">
          If this looks wrong, please contact whoever manages your
          One&Only account at your organisation. They can reach a
          platform admin to review the decision.
        </p>
        <div className="mt-6 flex flex-col gap-2 w-full">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-[color:var(--color-paper-line)] dark:border-strong px-3 py-2 text-ui-13 text-body dark:text-inverse-muted hover:bg-[color:var(--color-paper-sunken)] dark:hover:bg-inverse"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  )
}



