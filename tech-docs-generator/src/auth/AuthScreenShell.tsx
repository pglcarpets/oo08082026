import type { ReactNode } from "react";

type AuthScreenShellProps = {
  children: ReactNode;
  /** Optional badge above the card (e.g. lock icon row lives inside children) */
  compact?: boolean;
};

export function AuthScreenShell({ children, compact = false }: AuthScreenShellProps) {
  return (
    <div className="docs-auth-shell min-h-screen flex flex-col">
      <header className="px-6 pt-6 sm:pt-8">
        <a
          href="/"
          className="inline-flex items-center gap-2.5 no-underline text-inherit"
          aria-label="One&Only home"
        >
          <img
            src="/icon.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
          />
          <img
            src="/logo-v2.webp"
            alt="One&Only Furniture"
            width={160}
            height={41}
            className="h-7 w-auto max-w-[10rem] object-contain object-left"
          />
        </a>
      </header>
      <main
        className={`flex-1 flex items-start justify-center px-6 pb-12 ${
          compact ? "pt-8 sm:pt-12" : "pt-10 sm:pt-16"
        }`}
      >
        <div className="w-full max-w-md">
          <div className="docs-auth-card rounded-xl border border-docs-border bg-docs-surface-raised p-8 shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthScreenHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-6 space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-docs-text-strong">
        {title}
      </h1>
      <p className="text-sm leading-relaxed text-docs-text-muted">{subtitle}</p>
    </div>
  );
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <p
      className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}
