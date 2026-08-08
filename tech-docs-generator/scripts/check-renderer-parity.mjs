import path from 'node:path'
import { canonicalJsonString, readCanonicalJsonFile } from './filesystem.mjs'
import { buildGeneratorModel } from './model.mjs'
import { getRendererDataRoot, getSourcePackageRoot } from './output-contract.mjs'
import {
  buildRendererAccuracyReport,
  buildRendererDataPayloads,
  PARITY_DATA_FILES,
} from './renderer-data.mjs'

function documentsDataPath(documentsRoot, filename) {
  return path.join(documentsRoot, 'data', filename)
}

function rendererDataPath(repoRoot, filename) {
  return path.join(getRendererDataRoot(repoRoot), filename)
}

function canonicalText(value) {
  return canonicalJsonString(value)
}

export async function checkRendererParity({
  repoRoot,
  documentsRoot,
} = {}) {
  const mismatches = []
  const model = buildGeneratorModel({ repoRoot })
  const expectedPayloads = buildRendererDataPayloads(model)

  for (const filename of PARITY_DATA_FILES) {
    const expectedText = canonicalText(expectedPayloads[filename])
    let documentsValue
    let rendererValue

    try {
      documentsValue = await readCanonicalJsonFile(documentsDataPath(documentsRoot, filename))
    } catch (error) {
      mismatches.push({
        file: filename,
        surface: 'Documents/data',
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    try {
      rendererValue = await readCanonicalJsonFile(rendererDataPath(repoRoot, filename))
    } catch (error) {
      mismatches.push({
        file: filename,
        surface: 'generated-documents/data',
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    const documentsText = canonicalText(documentsValue)
    const rendererText = canonicalText(rendererValue)

    if (documentsText !== expectedText) {
      mismatches.push({
        file: filename,
        surface: 'Documents/data',
        reason: 'does not match current generator model',
      })
    }

    if (rendererText !== expectedText) {
      mismatches.push({
        file: filename,
        surface: 'generated-documents/data',
        reason: 'does not match current generator model',
      })
    }

    if (documentsText !== rendererText) {
      mismatches.push({
        file: filename,
        surface: 'parity',
        reason: 'generated docs and renderer data differ',
      })
    }
  }

  return mismatches
}

export async function checkRendererAccuracy({ repoRoot } = {}) {
  const accuracyPath = rendererDataPath(repoRoot, '_accuracy-renderer.json')
  const model = buildGeneratorModel({ repoRoot })
  const packageRoot = getSourcePackageRoot(repoRoot)
  const expected = buildRendererAccuracyReport(model, buildRendererDataPayloads(model), { packageRoot })

  let actual
  try {
    actual = await readCanonicalJsonFile(accuracyPath)
  } catch (error) {
    return [
      {
        file: '_accuracy-renderer.json',
        reason: error instanceof Error ? error.message : String(error),
      },
    ]
  }

  const mismatches = []
  if (actual.mismatches?.length) {
    mismatches.push(...actual.mismatches.map((item) => ({ file: '_accuracy-renderer.json', ...item })))
  }

  const expectedText = canonicalJsonString(expected)
  const actualComparable = { ...actual, mismatches: [] }
  if (canonicalJsonString(actualComparable) !== expectedText) {
    mismatches.push({
      file: '_accuracy-renderer.json',
      reason: 'stale renderer accuracy report — run tech-docs:generate',
    })
  }

  return mismatches
}
