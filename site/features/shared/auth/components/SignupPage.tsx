import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle as CheckCircle2, CircleNotch as Loader2 } from "@phosphor-icons/react"
import { createAuthClient } from '@/platform/supabase/client'
import { ResendVerificationButton } from './ResendVerificationButton'
import { humanizeAuthError } from '../lib/humanizeAuthError'
import { Button, Input } from './AuthControls'
import {
  AuthShell,
  AuthHeading,
  AuthFieldLabel as FieldLabel,
  AuthErrorBanner,
  AuthLinks,
} from './AuthShell'

const supabase = createAuthClient()

export function SignupForm({ onSuccess }: { onSuccess?: () => void }) {
  const params = useSearchParams()
  const legacyInvite = params.get('invite')
  if (legacyInvite) {
    sessionStorage.setItem('pending_invite_token', legacyInvite)
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('invite')
    window.history.replaceState(
      window.history.state,
      '',
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
    )
  }
  const presetEmail = params.get('email') ?? ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(presetEmail)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)

    let error: unknown = null
    try {
      const res = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      error = res.error
    } catch (e) {
      error = e
    }
    setBusy(false)
    if (error) {
      setError(humanizeAuthError(error))
      return
    }
    setDone(true)
    if (onSuccess) {onSuccess()}
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success dark:bg-green-950/40 dark:text-green-400"
        >
          <CheckCircle2 size={24} />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-heading dark:text-foreground">
          Check your inbox
        </h1>
        <p className="mt-2 text-ui-13 text-muted dark:text-subtle">
          We sent a verification link to{' '}
          <span className="font-medium text-body dark:text-inverse-muted">{email}</span>.
          Click it to finish setting up your account.
        </p>
        <div className="mt-6 w-full border-t border-soft pt-5 dark:border-strong">
          <p className="mb-1 text-ui-11 text-muted dark:text-subtle">
            Didn&apos;t get the email? Check your spam folder or resend:
          </p>
          <ResendVerificationButton email={email} />
        </div>
      </div>
    )
  }

  return (
    <>
      {error && <AuthErrorBanner id="signup-form-error" message={error} />}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FieldLabel htmlFor="signup-name" label="Name">
          <Input
            id="signup-name"
            autoComplete="name"
            required
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'signup-form-error' : undefined}
          />
        </FieldLabel>

        <FieldLabel htmlFor="signup-email" label="Email">
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            readOnly={!!presetEmail}
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'signup-form-error' : undefined}
          />
        </FieldLabel>

        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="block text-ui-13 font-medium text-body dark:text-inverse-muted"
          >
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            invalid={!!error}
            aria-describedby={
              error ? 'signup-form-error signup-password-hint' : 'signup-password-hint'
            }
          />
          <p
            id="signup-password-hint"
            className="text-ui-11 text-muted dark:text-subtle"
          >
            8+ characters.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={busy}
          className="w-full py-2"
          leftIcon={
            busy ? (
              <Loader2
                size={14}
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : undefined
          }
        >
          {busy ? 'Creating account…' : 'Create account'}
        </Button>

        <p className="text-center text-ui-11 leading-relaxed text-muted dark:text-subtle">
          By creating an account you agree to our{' '}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-body dark:hover:text-inverse-muted"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-body dark:hover:text-inverse-muted"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </>
  )
}

export function SignupPage() {
  const params = useSearchParams()
  const legacyInvite = params.get('invite')
  if (legacyInvite) {
    sessionStorage.setItem('pending_invite_token', legacyInvite)
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete('invite')
    window.history.replaceState(
      window.history.state,
      '',
      cleanUrl.pathname + cleanUrl.search + cleanUrl.hash,
    )
  }

  return (
    <AuthShell documentTitle="Create account">
      <AuthHeading
        title="Create your workspace"
        subtitle="Start planning your office in minutes. Free for small teams."
      />

      <SignupForm />

      <AuthLinks>
        <span />
        <span className="text-subtle dark:text-muted">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-[color:var(--color-blueprint-strong)] dark:text-[color:var(--color-blueprint)] hover:underline"
          >
            Sign in
          </Link>
        </span>
      </AuthLinks>
    </AuthShell>
  )
}



