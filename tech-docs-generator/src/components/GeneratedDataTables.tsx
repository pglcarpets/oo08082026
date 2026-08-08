const methodColors: Record<string, string> = {
  GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  POST: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
  PUT: 'bg-accent-500/15 text-accent-400 border-amber-500/30',
  PATCH: 'bg-accent-500/15 text-accent-400 border-amber-500/30',
  DELETE: 'bg-danger-500/15 text-danger-400 border-red-500/30',
}

export function GeneratedApiTable({
  routes,
}: {
  routes: Array<{
    method: string
    path: string
    authRole?: string
    sourcePath: string
    sourcePointer: string
  }>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-docs-border">
      <table className="w-full text-left text-sm leading-relaxed">
        <thead className="bg-docs-surface/80 text-xs uppercase tracking-wide text-docs-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Path</th>
            <th className="px-4 py-3 font-medium">Auth role</th>
            <th className="px-4 py-3 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route) => (
            <tr key={`${route.method}-${route.path}`} className="border-t border-docs-border/80 align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold border ${
                    methodColors[route.method] ?? 'bg-docs-surface-strong text-docs-text border-docs-border-hover'
                  }`}
                >
                  {route.method}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-docs-text break-all">{route.path}</td>
              <td className="px-4 py-3 text-sm font-mono text-docs-text-muted whitespace-nowrap">
                {route.authRole ?? '—'}
              </td>
              <td className="px-4 py-3 text-sm text-docs-text-muted">
                <code className="break-all">{route.sourcePath}</code>
                <span className="block text-docs-text-subtle break-all">{route.sourcePointer}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GeneratedKeyValueTable({
  rows,
}: {
  rows: Array<{
    label: string
    value: string
    sourcePath: string
    sourcePointer: string
    classification?: string
    browserExposure?: string
    verificationMode?: string
    renderSurface?: string | string[]
  }>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-docs-border">
      <table className="w-full text-left text-sm leading-relaxed">
        <thead className="bg-docs-surface/80 text-xs uppercase tracking-wide text-docs-text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Label</th>
            <th className="px-4 py-3 font-medium">Value</th>
            <th className="px-4 py-3 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} className="border-t border-docs-border/80 align-top">
              <td className="px-4 py-3 font-mono text-brand-400 whitespace-nowrap">{row.label}</td>
              <td className="px-4 py-3 text-docs-text break-all">{row.value}</td>
              <td className="px-4 py-3 text-sm text-docs-text-muted whitespace-nowrap">
                <code>{row.sourcePath}</code>
                <span className="block text-docs-text-subtle">{row.sourcePointer}</span>
                {(row.classification || row.browserExposure || row.verificationMode || row.renderSurface) && (
                  <span className="block text-docs-text-subtle">
                    {[row.classification, row.browserExposure, row.verificationMode]
                      .filter(Boolean)
                      .join(' · ')}
                    {row.renderSurface
                      ? `${[row.classification, row.browserExposure, row.verificationMode].some(Boolean) ? ' · ' : ''}${
                          Array.isArray(row.renderSurface) ? row.renderSurface.join(', ') : row.renderSurface
                        }`
                      : ''}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function GeneratedSimpleTable({
  columns,
  rows,
}: {
  columns: Array<{ key: string; header: string }>
  rows: Array<Record<string, string>>
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-docs-border">
      <table className="w-full text-left text-sm">
        <thead className="bg-docs-surface/80 text-xs uppercase tracking-wide text-docs-text-subtle">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-medium">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-docs-border/80 align-top">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 text-docs-text break-all">
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
