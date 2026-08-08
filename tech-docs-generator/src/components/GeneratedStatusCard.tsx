export function GeneratedStatusCard({
  label,
  value,
  classification,
  verificationMode,
  sourcePath,
  sourcePointer,
}: {
  label: string
  value: string
  classification: string
  verificationMode?: string
  sourcePath: string
  sourcePointer: string
}) {
  const tone =
    classification === 'code-proven'
      ? 'border-emerald-800/40 bg-emerald-950/10 text-emerald-400'
      : classification === 'manual-verification'
        ? 'border-amber-800/40 bg-accent-500/10/10 text-accent-400'
        : classification === 'live-status'
          ? 'border-orange-800/40 bg-warning-500/10/10 text-warning-400'
          : 'border-docs-border/40 bg-docs-surface/10 text-docs-text-muted'

  return (
    <div className={`card border ${tone.split(' ').slice(0, 2).join(' ')}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`text-sm font-semibold mb-1 ${tone.split(' ').slice(2).join(' ')}`}>{label}</h3>
          <p className="text-sm text-docs-text leading-relaxed">{value}</p>
        </div>
        <span className="badge bg-docs-surface-raised text-docs-text-muted border border-docs-border flex-shrink-0">{classification}</span>
      </div>
      <p className="text-xs text-docs-text-subtle mt-3">
        <code>{sourcePath}</code> · {sourcePointer}
        {verificationMode ? ` · ${verificationMode}` : ''}
      </p>
    </div>
  )
}
