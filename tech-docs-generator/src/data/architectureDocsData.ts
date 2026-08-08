import docsHealthJson from '../../../generated-documents/data/docs-health.json'

type DocsHealthRecord = {
  readonly category: string
  readonly label: string
  readonly sourcePath: string
  readonly sourcePointer: string
  readonly value: string
}

const docsHealthRecords = docsHealthJson as DocsHealthRecord[]

export const architectureDocuments = docsHealthRecords
  .filter((record) => record.category === 'architecture-doc')
  .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath))
