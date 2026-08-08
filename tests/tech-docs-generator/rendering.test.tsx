import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../tech-docs-generator/src/App'
import { CodeBlock } from '../../tech-docs-generator/src/components/CodeBlock'
import { CollapsibleSection } from '../../tech-docs-generator/src/components/CollapsibleSection'
import { MermaidDiagram } from '../../tech-docs-generator/src/components/MermaidDiagram'
import { SearchResults } from '../../tech-docs-generator/src/components/SearchResults'
import { Sidebar } from '../../tech-docs-generator/src/components/Sidebar'
import {
  deploymentCommandRecords,
  deploymentEnvironmentVariables,
} from '../../tech-docs-generator/src/data/deploymentData'
import { testCommands, testingPolicy } from '../../tech-docs-generator/src/data/testingData'

const mermaidMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(async () => ({ svg: '<svg data-testid="diagram"></svg>' })),
}))

const hljsMock = vi.hoisted(() => ({
  highlightElement: vi.fn(),
}))

vi.mock('mermaid', () => ({ default: mermaidMock }))
vi.mock('highlight.js', () => ({ default: hljsMock }))

function renderAppAt(path: string) {
  window.history.replaceState({}, '', path)
  return render(<App />)
}

function mockClipboard() {
  const writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
  return writeText
}

beforeEach(() => {
  mermaidMock.render.mockClear()
  hljsMock.highlightElement.mockClear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('App routes', () => {
  it.each([
    ['/', /oando platform/i, false],
    ['/tech-stack', /technology stack/i, false],
    ['/architecture', /architecture/i, false],
    ['/features', /features/i, false],
    ['/code-organization', /code organization/i, false],
    ['/database', /database/i, false],
    ['/api', /api design/i, false],
    ['/testing', /testing strategy/i, false],
    ['/deployment', /deployment/i, false],
    ['/security', /security practices/i, false],
    ['/performance', /performance optimization/i, false],
    ['/workflows', /development workflows/i, false],
  ])('renders %s', async (path, heading, needsMermaid) => {
    renderAppAt(path)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: heading }).tagName).toBe('H1')
    })

    if (needsMermaid) {
      await waitFor(() => {
        expect(mermaidMock.render).toHaveBeenCalled()
      })
    }
  })
})

describe('Page content anchors', () => {
  it.each([
    ['/workflows', /vitest run/i],
    ['/security', /db:advisors:security/i],
    ['/performance', /db:advisors:performance/i],
    ['/code-organization', /site\/features\/planner\//i],
    ['/database', /catalog_categories/i],
    ['/api', /Live API routes/i],
    // Product surfaces are extracted from app roots (e.g. planner → "Floor Planner");
    // legacy planner-marketing slugs like ai-assist are no longer emitted.
    ['/features', /Floor Planner/i],
    ['/', /Dependencies/i],
    ['/architecture', /API routes/i],
  ])('renders expected content on %s', async (path, factPattern) => {
    renderAppAt(path)

    await waitFor(() => {
      expect(screen.getAllByText(factPattern).length).toBeGreaterThan(0)
    })
  })

  it.each([
    // Prefer first available generated rows over pinned script/env keys —
    // those names churn when package.json / env inventory changes.
    ['/deployment', deploymentCommandRecords[0]?.value],
    ['/deployment', 'Deploy status'],
    ['/deployment', 'Branch deployment policy'],
    ['/deployment', 'Dependabot policy'],
    ['/deployment', 'Deploy blockers and handover context'],
    ['/deployment', deploymentEnvironmentVariables[0]?.name],
    ['/testing', testingPolicy[0]?.label],
    ['/testing', testingPolicy[0]?.fact.value],
    ['/testing', testCommands[0]?.command],
    ['/tech-stack', /Zod/],
  ])('renders generated-data-backed content on %s', async (path, factPattern) => {
    if (!factPattern) throw new Error(`missing generated data for ${path}`)

    renderAppAt(path)

    await waitFor(() => {
      expect(screen.getAllByText(factPattern).length).toBeGreaterThan(0)
    })
  })
})

describe('TechStack page', () => {
  it('filters categories and restores the full list', () => {
    renderAppAt('/tech-stack')

    fireEvent.click(screen.getByRole('button', { name: /runtime \(\d+\)/i }))

    expect(screen.getByRole('heading', { level: 2, name: /^runtime$/i }).tagName).toBe('H2')
    expect(screen.queryByRole('heading', { level: 2, name: /dev tooling/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /all/i }))

    expect(screen.getByRole('heading', { level: 2, name: /^runtime$/i }).tagName).toBe('H2')
    expect(screen.getByRole('heading', { level: 2, name: /dev tooling/i }).tagName).toBe('H2')
  })
})

describe('Sidebar', () => {
  it('toggles the mobile panel and the nested nav section', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/tech-stack']}>
        <Sidebar />
      </MemoryRouter>,
    )

    const desktopSidebar = container.querySelector('aside.hidden.lg\\:flex') as HTMLElement
    if (!desktopSidebar) throw new Error('desktop sidebar not found')

    const runtimeLink = within(desktopSidebar).getByRole('link', { name: /runtime/i })
    expect(runtimeLink.tagName).toBe('A')
    expect(runtimeLink.getAttribute('href')).toMatch(/tech-stack|runtime|#/i)

    const techStackButton = within(desktopSidebar).getByRole('button', { name: /tech stack/i })
    fireEvent.click(techStackButton)
    expect(within(desktopSidebar).queryByRole('link', { name: /runtime/i })).toBeNull()

    fireEvent.click(techStackButton)
    expect(within(desktopSidebar).getByRole('link', { name: /runtime/i }).tagName).toBe('A')

    fireEvent.click(screen.getAllByRole('button')[0])
    const mobileAside = container.querySelector('aside.lg\\:hidden')
    expect(mobileAside?.className).toContain('translate-x-0')

    const backdrop = container.querySelector('div.bg-black\\/50')
    if (!backdrop) throw new Error('mobile backdrop not found')

    fireEvent.click(backdrop)
    expect(container.querySelector('aside.lg\\:hidden')?.className).toContain('-translate-x-full')
  })

  it('closes the mobile backdrop with Enter and Space', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByLabelText('Open navigation'))
    fireEvent.keyDown(screen.getByLabelText('Close navigation'), { key: 'Enter' })
    expect(screen.queryByLabelText('Close navigation')).toBeNull()

    fireEvent.click(screen.getByLabelText('Open navigation'))
    fireEvent.keyDown(screen.getByLabelText('Close navigation'), { key: ' ' })
    expect(screen.queryByLabelText('Close navigation')).toBeNull()
  })
})

describe('SearchResults', () => {
  it('navigates to the selected result and closes the panel', () => {
    const onClose = vi.fn()

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <SearchResults
                results={[
                  {
                    id: 'planner',
                    title: 'Planner Feature',
                    path: '/features#planner',
                    section: 'Features',
                    content: 'planner',
                  },
                ]}
                onClose={onClose}
              />
            }
          />
          <Route path="/features" element={<div>Target page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: /planner feature/i }))

    expect(screen.getByText('Target page').textContent).toBe('Target page')
    expect(onClose).toHaveBeenCalled()
  })

  it('returns null when there are no results', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <SearchResults results={[]} onClose={vi.fn()} />
      </MemoryRouter>,
    )

    expect(container.firstChild).toBeNull()
  })
})

describe('CollapsibleSection', () => {
  it('starts open by default and collapses when clicked', () => {
    render(
      <CollapsibleSection title="Section" badge="Badge">
        <div>Body</div>
      </CollapsibleSection>,
    )

    expect(screen.getByText('Body').textContent).toBe('Body')
    fireEvent.click(screen.getByRole('button', { name: /section/i }))
    expect(screen.queryByText('Body')).toBeNull()
  })

  it('starts closed when defaultOpen is false', () => {
    render(
      <CollapsibleSection title="Closed" defaultOpen={false}>
        <div>Hidden body</div>
      </CollapsibleSection>,
    )

    expect(screen.queryByText('Hidden body')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /closed/i }))
    expect(screen.getByText('Hidden body').textContent).toBe('Hidden body')
  })
})

describe('CodeBlock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('copies titled code blocks', async () => {
    const writeText = mockClipboard()

    const { container } = render(<CodeBlock title="example.ts" language="ts" code="const answer = 42" />)

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy code/i }))
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith('const answer = 42')
    const successIcon = container.querySelector('svg.text-brand-600')
    expect(successIcon).toBeInstanceOf(Element)
    expect(successIcon?.classList.contains('text-brand-600')).toBe(true)
    await act(async () => {
      vi.runOnlyPendingTimers()
      await Promise.resolve()
    })
    const copySvg = container.querySelector('button[aria-label="Copy code"] svg')
    expect(copySvg).toBeInstanceOf(Element)
    expect(copySvg?.closest('button')?.getAttribute('aria-label')).toBe('Copy code')
  })

  it('renders untitled blocks with the floating copy controls', async () => {
    const writeText = mockClipboard()

    const { container } = render(<CodeBlock code="console.log('hi')" />)

    expect(screen.getAllByLabelText('Copy code').length).toBe(1)
    await act(async () => {
      fireEvent.click(screen.getByLabelText('Copy code'))
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith("console.log('hi')")
    const successIcon = container.querySelector('svg.text-brand-600')
    expect(successIcon).toBeInstanceOf(Element)
    expect(successIcon?.classList.contains('text-brand-600')).toBe(true)
    await act(async () => {
      vi.runOnlyPendingTimers()
      await Promise.resolve()
    })
    const copySvg = container.querySelector('button[aria-label="Copy code"] svg')
    expect(copySvg).toBeInstanceOf(Element)
    expect(copySvg?.closest('button')?.getAttribute('aria-label')).toBe('Copy code')
  })
})

describe('MermaidDiagram', () => {
  it('renders the diagram svg when mermaid succeeds', async () => {
    mermaidMock.render.mockResolvedValueOnce({ svg: '<svg data-testid="diagram"></svg>' })

    const { container } = render(
      <MermaidDiagram chart="flowchart TB\nA-->B" title="Example Diagram" />,
    )

    await waitFor(() => {
      expect(mermaidMock.render).toHaveBeenCalled()
      const diagram = container.querySelector('svg[data-testid="diagram"]')
      expect(diagram).toBeInstanceOf(Element)
      expect(diagram?.getAttribute('data-testid')).toBe('diagram')
    })

    expect(screen.getByText('Example Diagram').textContent).toBe('Example Diagram')
  })

  it('shows an error when mermaid fails', async () => {
    mermaidMock.render.mockRejectedValueOnce(new Error('boom'))

    render(<MermaidDiagram chart="flowchart TB\nA-->B" />)

    await waitFor(() => {
      expect(screen.getByText('boom').textContent).toBe('boom')
    })
  })
})
