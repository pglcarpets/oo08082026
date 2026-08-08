import Link from "next/link";

interface ProductEntryPageProps {
  title: string;
  eyebrow: string;
  description: string;
  authenticated: boolean;
  guestMode: boolean;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  recentLabel: string;
  statusLabel: string;
  restrictions: string[];
  capabilities: string[];
}

export function ProductEntryPage({
  title,
  eyebrow,
  description,
  authenticated,
  guestMode,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  recentLabel,
  statusLabel,
  restrictions,
  capabilities,
}: ProductEntryPageProps) {
  return (
    <section
      className="min-h-screen px-6 py-10"
      style={{
        background:
          "radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 12%, transparent) 0%, transparent 30%), linear-gradient(180deg, var(--surface-page) 0%, var(--surface-soft) 60%, var(--surface-muted) 100%)",
      }}
    >
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl flex-col justify-center gap-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div
            className="rounded-[2rem] border p-8 sm:p-10"
            style={{
              borderColor: "var(--border-soft)",
              background: "var(--overlay-panel-95)",
              boxShadow: "var(--shadow-panel)",
            }}
          >
            <p className="text-[0.75rem] font-semibold uppercase tracking-[0.3em]" style={{ color: "var(--color-accent-strong)" }}>
              {eyebrow}
            </p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight sm:text-6xl" style={{ color: "var(--text-heading)" }}>
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 sm:text-lg" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:-translate-y-0.5"
                style={{
                  background: "var(--color-primary)",
                  color: "var(--text-inverse)",
                }}
              >
                {primaryLabel}
              </Link>
              <Link
                href={secondaryHref}
                className="rounded-full border px-6 py-3 text-sm font-semibold"
                style={{
                  borderColor: "var(--border-soft)",
                  color: "var(--color-primary)",
                  background: "var(--surface-page)",
                }}
              >
                {secondaryLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] border p-5" style={{ borderColor: "var(--border-soft)", background: "var(--surface-soft)" }}>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-subtle)" }}>
                  Recent / resume
                </p>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-body)" }}>
                  {recentLabel}
                </p>
              </div>
              <div className="rounded-[1.4rem] border p-5" style={{ borderColor: "var(--border-soft)", background: "var(--surface-soft)" }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--text-subtle)" }}>
                  Status
                </p>
                <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-body)" }}>
                  {statusLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5">
            <div
              className="rounded-[2rem] border p-6"
              style={{
                borderColor: "var(--border-soft)",
                background: "var(--overlay-panel-92)",
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-primary)" }}>
                Capability summary
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7" style={{ color: "var(--text-body)" }}>
                {capabilities.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" style={{ color: "var(--color-accent-strong)" }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-[2rem] border p-6"
              style={{
                borderColor: guestMode ? "var(--border-accent)" : "var(--border-soft)",
                background: guestMode ? "var(--surface-accent-wash)" : "var(--overlay-panel-92)",
              }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "var(--color-primary)" }}>
                Guest limitations
              </p>
              <p className="mt-3 text-sm leading-7" style={{ color: "var(--text-muted)" }}>
                {guestMode
                  ? "Restricted actions remain visible inside the live tool and explain why they are unavailable."
                  : authenticated
                    ? "Member access unlocks the full output and persistence flow after you launch the tool."
                    : "Guests can still explore the live product surface, but output and persistence actions stay disabled."}
              </p>
              <ul className="mt-5 space-y-3 text-sm leading-7" style={{ color: "var(--text-body)" }}>
                {restrictions.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" style={{ color: "var(--color-accent-strong)" }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
