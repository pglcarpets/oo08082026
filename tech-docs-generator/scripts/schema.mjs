const OBJECT_TAG = '[object Object]'

export class SchemaValidationError extends Error {
  constructor(schemaName, issues) {
    const details = issues.map(({ path, message }) => `${path.join('.')} ${message}`).join('; ')
    super(details ? `${schemaName} validation failed: ${details}` : `${schemaName} validation failed`)
    this.name = 'SchemaValidationError'
    this.schemaName = schemaName
    this.issues = issues
  }
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === OBJECT_TAG
}

function issue(path, message) {
  return { path, message }
}

function schema(name, validate) {
  return {
    name,
    parse(value) {
      const result = validate(value)
      if (!result.ok) {
        throw new SchemaValidationError(name, result.issues)
      }
      return result.value
    },
    safeParse(value) {
      try {
        return { success: true, data: this.parse(value) }
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          return { success: false, error }
        }
        throw error
      }
    },
  }
}

function fail(issues) {
  return { ok: false, issues }
}

function pass(value) {
  return { ok: true, value }
}

function validateNonEmptyString(value, path) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return issue(path, 'Expected a non-empty string')
  }
  return null
}

function validateInteger(value, path, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) {
    return issue(path, `Expected an integer greater than or equal to ${minimum}`)
  }
  return null
}

function validateArray(value, path) {
  if (!Array.isArray(value)) {
    return issue(path, 'Expected an array')
  }
  return null
}

function validateEnumValue(value, path, allowed) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return issue(path, `Expected one of: ${allowed.join(', ')}`)
  }
  return null
}

function validatePlainObject(value, path) {
  if (!isPlainObject(value)) {
    return issue(path, 'Expected an object')
  }
  return null
}

function validateFactField(value, path = []) {
  const issues = []
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const valueIssue = value.value === undefined ? issue([...path, 'value'], 'Expected a defined value') : null
  const sourcePathIssue = validateNonEmptyString(value.sourcePath, [...path, 'sourcePath'])
  const sourceKindIssue = validateNonEmptyString(value.sourceKind, [...path, 'sourceKind'])
  const sourcePointerIssue = validateNonEmptyString(value.sourcePointer, [...path, 'sourcePointer'])
  const factClassificationIssue = validateEnumValue(
    value.factClassification,
    [...path, 'factClassification'],
    ['code-proven', 'handover-proven', 'manual-verification', 'live-status', 'unknown-gap'],
  )
  const browserExposureIssue = validateEnumValue(
    value.browserExposure,
    [...path, 'browserExposure'],
    ['public-safe', 'server-name-safe', 'server-report-only', 'secret-value-forbidden'],
  )
  const secretRiskIssue = validateEnumValue(
    value.secretRisk,
    [...path, 'secretRisk'],
    ['none', 'name-only', 'secret-value-forbidden'],
  )
  const verificationModeIssue = validateEnumValue(
    value.verificationMode,
    [...path, 'verificationMode'],
    ['source-backed', 'manual-verification'],
  )

  for (const candidate of [
    valueIssue,
    sourcePathIssue,
    sourceKindIssue,
    sourcePointerIssue,
    factClassificationIssue,
    browserExposureIssue,
    secretRiskIssue,
    verificationModeIssue,
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  if (value.renderSurface !== undefined) {
    const renderSurfaceIssue = Array.isArray(value.renderSurface)
      ? value.renderSurface.flatMap((entry, index) => {
          const itemIssue = validateEnumValue(entry, [...path, 'renderSurface', index], ['markdown', 'renderer', 'internal-report'])
          return itemIssue ? [itemIssue] : []
        })
      : [validateEnumValue(value.renderSurface, [...path, 'renderSurface'], ['markdown', 'renderer', 'internal-report'])]

    for (const candidate of renderSurfaceIssue) {
      if (candidate) {
        issues.push(candidate)
      }
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateNormalizedFact(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  const idIssue = validateNonEmptyString(value.id, [...path, 'id'])
  const domainIssue = validateNonEmptyString(value.domain, [...path, 'domain'])
  const categoryIssue = validateNonEmptyString(value.category, [...path, 'category'])
  const fieldIssue = validateNonEmptyString(value.field, [...path, 'field'])
  const factIssue = validateFactField(value.fact, [...path, 'fact'])

  for (const candidate of [idIssue, domainIssue, categoryIssue, fieldIssue]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  if (value.label !== undefined) {
    const labelIssue = validateNonEmptyString(value.label, [...path, 'label'])
    if (labelIssue) {
      issues.push(labelIssue)
    }
  }

  if (!factIssue.ok) {
    issues.push(...factIssue.issues)
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateConflict(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.domain, [...path, 'domain']),
    validateNonEmptyString(value.field, [...path, 'field']),
    validateNonEmptyString(value.reason, [...path, 'reason']),
    validateFactField(value.winner?.fact ?? value.winner, [...path, 'winner', value.winner?.fact ? 'fact' : '']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  const losersIssue = validateArray(value.losers, [...path, 'losers'])
  if (losersIssue) {
    issues.push(losersIssue)
  } else {
    value.losers.forEach((loser, index) => {
      const result = validateFactField(loser?.fact ?? loser, [...path, 'losers', index, loser?.fact ? 'fact' : ''])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateSection(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.id, [...path, 'id']),
    validateNonEmptyString(value.title, [...path, 'title']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  if (value.factIds !== undefined) {
    const factIdsIssue = validateArray(value.factIds, [...path, 'factIds'])
    if (factIdsIssue) {
      issues.push(factIdsIssue)
    } else {
      value.factIds.forEach((factId, index) => {
        const itemIssue = validateNonEmptyString(factId, [...path, 'factIds', index])
        if (itemIssue) {
          issues.push(itemIssue)
        }
      })
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validatePage(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.id, [...path, 'id']),
    validateNonEmptyString(value.path, [...path, 'path']),
    validateNonEmptyString(value.title, [...path, 'title']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  const sectionsIssue = validateArray(value.sections, [...path, 'sections'])
  if (sectionsIssue) {
    issues.push(sectionsIssue)
  } else {
    value.sections.forEach((section, index) => {
      const result = validateSection(section, [...path, 'sections', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  if (value.factIds !== undefined) {
    const factIdsIssue = validateArray(value.factIds, [...path, 'factIds'])
    if (factIdsIssue) {
      issues.push(factIdsIssue)
    } else {
      value.factIds.forEach((factId, index) => {
        const itemIssue = validateNonEmptyString(factId, [...path, 'factIds', index])
        if (itemIssue) {
          issues.push(itemIssue)
        }
      })
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateSearchRecord(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.id, [...path, 'id']),
    validateNonEmptyString(value.title, [...path, 'title']),
    validateNonEmptyString(value.path, [...path, 'path']),
    validateNonEmptyString(value.excerpt, [...path, 'excerpt']),
    validateNonEmptyString(value.section, [...path, 'section']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  if (value.factIds !== undefined) {
    const factIdsIssue = validateArray(value.factIds, [...path, 'factIds'])
    if (factIdsIssue) {
      issues.push(factIdsIssue)
    } else {
      value.factIds.forEach((factId, index) => {
        const itemIssue = validateNonEmptyString(factId, [...path, 'factIds', index])
        if (itemIssue) {
          issues.push(itemIssue)
        }
      })
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateSourceRecord(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.sourcePath, [...path, 'sourcePath']),
    validateNonEmptyString(value.sourceKind, [...path, 'sourceKind']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  if (value.sourcePointer !== undefined) {
    const pointerIssue = validateNonEmptyString(value.sourcePointer, [...path, 'sourcePointer'])
    if (pointerIssue) {
      issues.push(pointerIssue)
    }
  }

  if (value.hash !== undefined) {
    const hashIssue = validateNonEmptyString(value.hash, [...path, 'hash'])
    if (hashIssue) {
      issues.push(hashIssue)
    }
  }

  if (value.bytes !== undefined) {
    const bytesIssue = validateInteger(value.bytes, [...path, 'bytes'], 0)
    if (bytesIssue) {
      issues.push(bytesIssue)
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateSourcesDocument(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  const entriesIssue = validateArray(value.entries, [...path, 'entries'])
  if (entriesIssue) {
    issues.push(entriesIssue)
  } else {
    value.entries.forEach((entry, index) => {
      const result = validateSourceRecord(entry, [...path, 'entries', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateAccuracyMismatch(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.factId, [...path, 'factId']),
    validateNonEmptyString(value.expected, [...path, 'expected']),
    validateNonEmptyString(value.actual, [...path, 'actual']),
    validateNonEmptyString(value.reason, [...path, 'reason']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateAccuracyDocument(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.path, [...path, 'path']),
    validateInteger(value.factualFields, [...path, 'factualFields'], 0),
    validateInteger(value.exactMatches, [...path, 'exactMatches'], 0),
    validateInteger(value.mismatches, [...path, 'mismatches'], 0),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateAccuracyReport(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateInteger(value.totalFactualFields, [...path, 'totalFactualFields'], 0),
    validateInteger(value.fieldsWithProvenance, [...path, 'fieldsWithProvenance'], 0),
    validateInteger(value.exactSourceMatches, [...path, 'exactSourceMatches'], 0),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  const mismatchesIssue = validateArray(value.mismatches, [...path, 'mismatches'])
  if (mismatchesIssue) {
    issues.push(mismatchesIssue)
  } else {
    value.mismatches.forEach((mismatch, index) => {
      const result = validateAccuracyMismatch(mismatch, [...path, 'mismatches', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  const docsIssue = validateArray(value.documents, [...path, 'documents'])
  if (docsIssue) {
    issues.push(docsIssue)
  } else {
    value.documents.forEach((doc, index) => {
      const result = validateAccuracyDocument(doc, [...path, 'documents', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateManifestEntry(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.path, [...path, 'path']),
    validateNonEmptyString(value.hash, [...path, 'hash']),
    validateInteger(value.bytes, [...path, 'bytes'], 0),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateManifest(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.version, [...path, 'version']),
    validateNonEmptyString(value.root, [...path, 'root']),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  const filesIssue = validateArray(value.files, [...path, 'files'])
  if (filesIssue) {
    issues.push(filesIssue)
  } else {
    value.files.forEach((entry, index) => {
      const result = validateManifestEntry(entry, [...path, 'files', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateCoverageMatrixRow(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  for (const candidate of [
    validateNonEmptyString(value.domain, [...path, 'domain']),
    validateEnumValue(value.status, [...path, 'status'], ['covered', 'partial', 'manual-verification', 'unknown-gap']),
    validateInteger(value.recordCount, [...path, 'recordCount'], 0),
    validateInteger(value.codeProvenCount, [...path, 'codeProvenCount'], 0),
    validateInteger(value.handoverProvenCount, [...path, 'handoverProvenCount'], 0),
    validateInteger(value.manualVerificationCount, [...path, 'manualVerificationCount'], 0),
    validateInteger(value.liveStatusCount, [...path, 'liveStatusCount'], 0),
    validateInteger(value.unknownGapCount, [...path, 'unknownGapCount'], 0),
    validateInteger(value.unsupportedClaimCount, [...path, 'unsupportedClaimCount'], 0),
  ]) {
    if (candidate) {
      issues.push(candidate)
    }
  }

  const bucketTotal =
    (value.codeProvenCount ?? 0) +
    (value.handoverProvenCount ?? 0) +
    (value.manualVerificationCount ?? 0) +
    (value.liveStatusCount ?? 0) +
    (value.unknownGapCount ?? 0) +
    (value.unsupportedClaimCount ?? 0)

  if (value.recordCount !== undefined && Number.isInteger(value.recordCount) && value.recordCount !== bucketTotal) {
    issues.push(issue([...path, 'recordCount'], 'Expected recordCount to equal the sum of the count buckets'))
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateCoverageMatrixDocument(value, path = []) {
  const objectIssue = validatePlainObject(value, path)
  if (objectIssue) {
    return fail([objectIssue])
  }

  const issues = []
  const contractSourcePathIssue = validateNonEmptyString(value.contractSourcePath, [...path, 'contractSourcePath'])
  if (contractSourcePathIssue) {
    issues.push(contractSourcePathIssue)
  }

  const rowsIssue = validateArray(value.rows, [...path, 'rows'])
  if (rowsIssue) {
    issues.push(rowsIssue)
  } else {
    value.rows.forEach((row, index) => {
      const result = validateCoverageMatrixRow(row, [...path, 'rows', index])
      if (!result.ok) {
        issues.push(...result.issues)
      }
    })
  }

  return issues.length > 0 ? fail(issues) : pass(value)
}

function validateDependenciesFact(value, path = []) {
  const arrayIssue = validateArray(value, path)
  if (arrayIssue) return fail([arrayIssue])

  const issues = []
  value.forEach((record, index) => {
    const recordPath = [...path, String(index)]
    const objectIssue = validatePlainObject(record, recordPath)
    if (objectIssue) {
      issues.push(objectIssue)
      return
    }

    const idIssue = validateNonEmptyString(record.id, [...recordPath, 'id'])
    if (idIssue) issues.push(idIssue)

    const factIssue = validateFactField(record.fact, [...recordPath, 'fact'])
    if (!factIssue.ok) issues.push(...factIssue.issues)
  })

  return issues.length > 0 ? fail(issues) : pass(value)
}

export const factFieldSchema = schema('FactField', validateFactField)
export const normalizedFactSchema = schema('NormalizedFact', validateNormalizedFact)
export const conflictSchema = schema('Conflict', validateConflict)
export const pageSchema = schema('Page', validatePage)
export const sectionSchema = schema('Section', validateSection)
export const searchRecordSchema = schema('SearchRecord', validateSearchRecord)
export const sourcesDocumentSchema = schema('SourcesDocument', validateSourcesDocument)
export const sourceRecordSchema = schema('SourceRecord', validateSourceRecord)
export const accuracyMismatchSchema = schema('AccuracyMismatch', validateAccuracyMismatch)
export const accuracyDocumentSchema = schema('AccuracyDocument', validateAccuracyDocument)
export const accuracyReportSchema = schema('AccuracyReport', validateAccuracyReport)
export const manifestEntrySchema = schema('ManifestEntry', validateManifestEntry)
export const manifestSchema = schema('Manifest', validateManifest)
export const coverageMatrixRowSchema = schema('CoverageMatrixRow', validateCoverageMatrixRow)
export const coverageMatrixSchema = schema('CoverageMatrix', validateCoverageMatrixDocument)
export const dependenciesFactSchema = schema('DependenciesFact', validateDependenciesFact)

export function formatSchemaIssues(error) {
  return error.issues.map(({ path, message }) => `${path.join('.')} ${message}`)
}

export const schemas = {
  factFieldSchema,
  normalizedFactSchema,
  conflictSchema,
  pageSchema,
  sectionSchema,
  searchRecordSchema,
  sourcesDocumentSchema,
  sourceRecordSchema,
  accuracyMismatchSchema,
  accuracyDocumentSchema,
  accuracyReportSchema,
  manifestEntrySchema,
  manifestSchema,
  coverageMatrixRowSchema,
  coverageMatrixSchema,
  dependenciesFactSchema,
}
