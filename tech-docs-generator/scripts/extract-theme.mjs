import { statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { createNormalizedRecord } from './normalized-record.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/** Live token sheets (canonical FOCSS under site/focss). */
const THEME_PATHS = [
  'site/focss/base/tokens/palette.css',
  'site/focss/base/tokens/semantic.css',
  'site/focss/base/type/typography.css',
  'site/focss/base/tokens/layout.css',
]

export function extractThemeRecords({ repoRoot = defaultRepoRoot } = {}) {
  const records = []
  let totalBytes = 0

  for (const themePath of THEME_PATHS) {
    const themeAbs = path.join(repoRoot, themePath)
    const themeStat = statSync(themeAbs)
    totalBytes += themeStat.size

    records.push(
      createNormalizedRecord({
        id: `theme.token-source.${path.basename(themePath, '.css')}`,
        category: 'theme-token',
        label: `Design token source · ${path.basename(themePath)}`,
        value: themePath,
        sourcePath: themePath,
        sourceKind: 'theme-token-file',
        sourcePointer: path.basename(themePath),
      }),
    )
  }

  records.push(
    createNormalizedRecord({
      id: 'theme.token-source.bytes',
      category: 'theme-token',
      label: 'Token files size (bytes)',
      value: String(totalBytes),
      sourcePath: THEME_PATHS.join(','),
      sourceKind: 'theme-token-file',
      sourcePointer: 'file.size',
    }),
  )

  return records
}
