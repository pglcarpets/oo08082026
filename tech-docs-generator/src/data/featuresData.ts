import featuresJson from '../../../generated-documents/data/features.json'

export type FeatureRecord = {
  kind?: string
  slug: string
  title: string
  tagline: string
  summary: string
  sourcePath: string
  sourceKind?: string
  sourcePointer: string
  tryPath?: string
  memberPath?: string
  pageCount?: number
  samplePaths?: string[]
}

export const featureRecords = (featuresJson as FeatureRecord[]).sort((left, right) =>
  left.slug.localeCompare(right.slug),
)

export const productSurfaceRecords = featureRecords.filter(
  (record) => record.kind === 'product-surface' || (!record.kind && !record.slug.startsWith('auth-')),
)

export const authFeatureRecords = featureRecords.filter(
  (record) =>
    record.kind === 'auth-role' ||
    record.kind === 'auth-helper' ||
    record.kind === 'auth-gate' ||
    record.kind === 'auth-role-usage' ||
    record.slug.startsWith('auth-'),
)

export const otherFeatureRecords = featureRecords.filter(
  (record) =>
    !productSurfaceRecords.includes(record) && !authFeatureRecords.includes(record),
)
