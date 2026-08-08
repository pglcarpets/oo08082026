import { useEffect, useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CircleNotch as Loader2 } from "@phosphor-icons/react"
import { createAuthClient } from '@/platform/supabase/client'
import {
  humanizeAuthError,
  isSuspendedAuthError,
} from '../lib/humanizeAuthError'
import { Button, Input } from './AuthControls'
import { sanitizeNextPath } from '@/lib/auth/plannerRedirect'
import {
  AuthShell,
  AuthHeading,
  AuthFieldLabel,
  AuthErrorBanner,
  AuthLinks,
} from './AuthShell'

const supabase = createAuthClient()

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next = sanitizeNextPath(params.get('next'))
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    let error: unknown = null
    try {
      const res = await supabase.auth.signInWithPassword({ email, password })
      error = res.error
    } catch (e) {
      error = e
    }
    setBusy(false)
    if (error) {
      if (isSuspendedAuthError(error)) {
        await supabase.auth.signOut().catch(() => {})
        router.replace('/suspended')
        return
      }
      setError(humanizeAuthError(error))
      return
    }
    if (onSuccess) {
      onSuccess();
    } else {
      router.replace(next)
    }
  }

  return (
    <>
      {error && <AuthErrorBanner id="login-form-error" message={error} />}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthFieldLabel htmlFor="login-email" label="Email">
          <Input
            id="login-email"
            ref={emailRef}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'login-form-error' : undefined}
          />
        </AuthFieldLabel>

        <AuthFieldLabel htmlFor="login-password" label="Password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            invalid={!!error}
            aria-describedby={error ? 'login-form-error' : undefined}
          />
        </AuthFieldLabel>

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
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </>
  )
}

export function LoginPage() {
  return (
    <AuthShell documentTitle="Sign in">
      <AuthHeading title="Welcome back" subtitle="Sign in to your workspace." />
      <LoginForm />

      <AuthLinks>
        <Link
          href="/forgot"
          className="text-muted hover:text-heading transition-colors"
        >
          Forgot password?
        </Link>
        <span className="text-subtle">
          Need an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[color:var(--color-blueprint-strong)] hover:underline"
          >
            Sign up
          </Link>
        </span>
      </AuthLinks>
    </AuthShell>
  )
}



