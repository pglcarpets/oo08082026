import Link from 'next/link'
import { WarningCircle as AlertCircle } from "@phosphor-icons/react"
import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/features/shared/auth/lib/useDocumentTitle'
import { OneAndOnlyLogo } from '@/components/ui/Logo'

/**
 * Shared chrome for every auth screen (login / signup / forgot / reset / verify).
 * Centered card with the real One&Only wordmark — same brand asset as Header/admin.
 */
export function AuthShell({
  children,
  /**
   * Browser tab title for this auth screen, e.g. "Sign in" or
   * "Create account". The shell appends "— One&Only" so the
   * suffix stays consistent with the rest of the app.
   */
  documentTitle,
}: {
  children: ReactNode
  documentTitle?: string
}) {
  useDocumentTitle(documentTitle ? `${documentTitle} — One&Only` : null)
  return (
    <div className="min-h-screen flex flex-col bg-blueprint-grid">
      <header className="px-6 pt-6 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 font-semibold tracking-tight text-heading dark:text-foreground"
          aria-label="One&Only home"
        >
          <OneAndOnlyLogo variant="orange" className="h-8 max-w-[10rem]" />
        </Link>
      </header>
      <main className="flex-1 flex items-start justify-center px-6 pt-10 pb-12 sm:pt-16">
        <div className="w-full max-w-md">
          <div className="rounded-md border border-[color:var(--color-paper-line)] bg-[color:var(--color-paper-raised)] p-8 shadow-sm dark:border-strong dark:bg-inverse/80">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6 space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-heading dark:text-foreground">
        {title}
      </h1>
      <p className="text-ui-13 text-muted dark:text-subtle">{subtitle}</p>
    </div>
  )
}

export function AuthFieldLabel({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="block text-ui-13 font-medium text-body dark:text-inverse-muted"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

export function AuthErrorBanner({ id, message }: { id: string; message: string }) {
  return (
    <div
      id={id}
      role="alert"
      className="mb-4 flex items-start gap-2.5 rounded-md border border-accent border-l-4 border-l-red-500 bg-danger-soft px-3 py-2.5 text-ui-13 text-red-800 dark:border-red-900/60 dark:border-l-red-500 dark:bg-red-950/40 dark:text-red-200"
    >
      <AlertCircle size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function AuthLinks({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex items-center justify-between text-ui-11">{children}</div>
}
