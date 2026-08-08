import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GeneratedDomainSection } from '../../tech-docs-generator/src/components/GeneratedDomainSection'

describe('GeneratedDomainSection', () => {
  it('renders grouped records and falls back to the raw category title', () => {
    render(
      <GeneratedDomainSection
        records={[
          {
            id: 'command-1',
            category: 'command',
            label: 'Test',
            value: 'pnpm run test',
            sourcePath: 'generated-documents/data/commands.json',
            sourceKind: 'generated-data',
            sourcePointer: 'commands[0]',
          },
          {
            id: 'command-2',
            category: 'command',
            label: 'Typecheck',
            value: 'pnpm run typecheck',
            sourcePath: 'generated-documents/data/commands.json',
            sourceKind: 'generated-data',
            sourcePointer: 'commands[1]',
          },
          {
            id: 'custom-1',
            category: 'custom-category',
            label: 'Docs',
            value: 'Generated docs',
            sourcePath: 'generated-documents/data/summary.json',
            sourceKind: 'generated-data',
            sourcePointer: 'summary[0]',
          },
        ]}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Commands' }).tagName).toMatch(/^H[1-6]$/)
    expect(screen.getByRole('heading', { name: 'custom-category' }).tagName).toMatch(/^H[1-6]$/)
    expect(screen.getByText('Test').textContent).toBe('Test')
    expect(screen.getByText('Typecheck').textContent).toBe('Typecheck')
    expect(screen.getByText('Docs').textContent).toBe('Docs')
  })

  it('renders the empty state message', () => {
    render(<GeneratedDomainSection records={[]} emptyMessage="Nothing here yet." />)

    expect(screen.getByText('Nothing here yet.').textContent).toBe('Nothing here yet.')
  })
})
