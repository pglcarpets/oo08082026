import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const appSearchMocks = vi.hoisted(() => {
  const setQuery = vi.fn()
  const useSearch = vi.fn(() => ({
    query: 'planner',
    setQuery,
    results: [
      {
        id: 'planner',
        title: 'Planner Feature',
        path: '/features#planner',
        section: 'Features',
        content: 'planner',
      },
    ],
  }))
  return { setQuery, useSearch }
})

vi.mock('../../tech-docs-generator/src/hooks/useSearch', () => ({
  useSearch: appSearchMocks.useSearch,
}))

vi.mock('mermaid', () => ({
  default: { initialize: vi.fn(), render: vi.fn().mockResolvedValue({ svg: '<svg></svg>' }) }
}))

import App from '../../tech-docs-generator/src/App'

describe('App search overlay', () => {
  it('shows results when the search hook returns matches', () => {
    window.history.replaceState({}, '', '/')

    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { name: /search docs/i })[0])

    const resultButton = screen.getByRole('button', { name: /planner feature/i })
    expect(resultButton.tagName).toBe('BUTTON')
    expect(resultButton.textContent).toMatch(/planner feature/i)

    fireEvent.click(resultButton)

    expect(appSearchMocks.setQuery).toHaveBeenCalledWith('')
  })
})
