export function createNormalizedRecord({
  id,
  category,
  label,
  value,
  sourcePath,
  sourceKind,
  sourcePointer,
  factClassification = 'code-proven',
  browserExposure = 'public-safe',
  secretRisk = 'none',
  renderSurface = ['markdown', 'renderer'],
  verificationMode = 'source-backed',
  status,
  risk,
}) {
  const record = {
    id,
    category,
    label,
    value: String(value),
    sourcePath,
    sourceKind,
    sourcePointer,
    factClassification,
    browserExposure,
    secretRisk,
    renderSurface: Array.isArray(renderSurface) ? [...new Set(renderSurface)] : [renderSurface],
    verificationMode,
  }

  if (status !== undefined) {
    record.status = status
  }
  if (risk !== undefined) {
    record.risk = risk
  }

  return record
}

export function filterBrowserRendererRecords(records) {
  return records.filter(
    (record) =>
      record.browserExposure !== 'server-report-only' &&
      record.browserExposure !== 'secret-value-forbidden' &&
      record.renderSurface.includes('renderer'),
  )
}

export function classifyEnvBrowserExposure(name) {
  if (name.startsWith('NEXT_PUBLIC_')) {
    return { browserExposure: 'public-safe', secretRisk: 'none' }
  }
  if (/(_API_KEY|_SECRET|_PASSWORD|_TOKEN|DATABASE_URL|SERVICE_ROLE)/i.test(name)) {
    return { browserExposure: 'server-name-safe', secretRisk: 'name-only' }
  }
  return { browserExposure: 'server-name-safe', secretRisk: 'none' }
}
