import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const PROVIDER_CHAIN_PATH = 'site/lib/ai/mastra/providerFetch.ts'

/**
 * @param {{ repoRoot?: string, api?: unknown[] }} [opts]
 */
export function extractAiRecords({ repoRoot = defaultRepoRoot, api = [] } = {}) {
  const text = readFileSync(path.join(repoRoot, PROVIDER_CHAIN_PATH), 'utf8')
  const records = []

  records.push(
    createNormalizedRecord({
      id: 'ai.provider-chain.module',
      category: 'ai-module',
      label: 'Provider chain module',
      value: PROVIDER_CHAIN_PATH,
      sourcePath: PROVIDER_CHAIN_PATH,
      sourceKind: 'source-module',
      sourcePointer: 'resolveProviderChain',
    }),
  )

  const envNames = [
    'OPENROUTER_API_KEY_PRIMARY',
    'OPENROUTER_API_KEY_BACKUP',
    'OPENROUTER_MODEL',
  ]
  for (const envName of envNames) {
    if (!text.includes(envName)) continue
    records.push(
      createNormalizedRecord({
        id: `ai.env.${envName}`,
        category: 'ai-env-name',
        label: envName,
        value: 'referenced in provider chain (name only)',
        sourcePath: PROVIDER_CHAIN_PATH,
        sourceKind: 'source-module',
        sourcePointer: `env.${envName}`,
        browserExposure: 'server-name-safe',
        secretRisk: 'name-only',
      }),
    )
  }

  if (text.includes('OPENROUTER_API_KEY_PRIMARY') && text.includes('OPENROUTER_API_KEY_BACKUP')) {
    records.push(
      createNormalizedRecord({
        id: 'ai.openrouter.fallback',
        category: 'ai-behavior',
        label: 'OpenRouter fallback chain',
        value: 'Primary key first, backup key second when both are configured',
        sourcePath: PROVIDER_CHAIN_PATH,
        sourceKind: 'source-module',
        sourcePointer: 'resolveProviderChain',
      }),
    )
  }

  const defaultModelMatch = text.match(/DEFAULT_OPENROUTER_MODEL\s*=\s*env\.OPENROUTER_MODEL\s*\|\|\s*"([^"]+)"/)
  if (defaultModelMatch) {
    records.push(
      createNormalizedRecord({
        id: 'ai.openrouter.default-model',
        category: 'ai-behavior',
        label: 'Default OpenRouter model fallback',
        value: defaultModelMatch[1],
        sourcePath: PROVIDER_CHAIN_PATH,
        sourceKind: 'source-module',
        sourcePointer: 'DEFAULT_OPENROUTER_MODEL',
      }),
    )
  }

  const aiRoutes = api.filter((record) =>
    /\/api\/(filter|generate-alt|nav-search|sketch|assistant)/i.test(record.path),
  )
  for (const route of aiRoutes) {
    records.push(
      createNormalizedRecord({
        id: `ai.route.${route.id}`,
        category: 'ai-route',
        label: route.path,
        value: route.method,
        sourcePath: route.sourcePath,
        sourceKind: 'api-route',
        sourcePointer: route.sourcePointer,
      }),
    )
  }

  return records.sort((left, right) => left.id.localeCompare(right.id))
}
