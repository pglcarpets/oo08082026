import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { checkThemeAlignment } from '../../../tech-docs-generator/scripts/check-theme-alignment.mjs'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "tech-docs-generator")

describe('theme alignment (plan 04)', () => {
  it('maps renderer brand/accent aliases to site tokens without forbidden hex', () => {
    const violations = checkThemeAlignment({ root: packageRoot })
    expect(violations).toEqual([])
  })
})
