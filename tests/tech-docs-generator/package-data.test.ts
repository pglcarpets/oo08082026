import { describe, expect, it } from 'vitest'

import { navItems } from '../../tech-docs-generator/src/data/navigation'
import { techStack } from '../../tech-docs-generator/src/data/techStack'

describe('tech docs package data', () => {
  it('nav items have unique ids', () => {
    const ids = navItems.flatMap((n) => [n.id, ...(n.children?.map((c) => c.id) ?? [])])
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('tech stack entries have name, category, role', () => {
    expect(techStack.length).toBeGreaterThan(5)
    for (const item of techStack) {
      expect(typeof item.name).toBe('string')
      expect(item.name.length).toBeGreaterThan(0)
      expect(typeof item.category).toBe('string')
      expect(item.category.length).toBeGreaterThan(0)
      expect(typeof item.role).toBe('string')
      expect(item.role.length).toBeGreaterThan(0)
    }
  })
})
