import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BackToTop } from '../../tech-docs-generator/src/components/BackToTop'
import { Breadcrumbs } from '../../tech-docs-generator/src/components/Breadcrumbs'
import { CommandPalette } from '../../tech-docs-generator/src/components/CommandPalette'
import { CopyButton } from '../../tech-docs-generator/src/components/CopyButton'
import { ReadingProgress } from '../../tech-docs-generator/src/components/ReadingProgress'
import { TableOfContents } from '../../tech-docs-generator/src/components/TableOfContents'
import { Tooltip } from '../../tech-docs-generator/src/components/Tooltip'

const navigate = vi.fn()
const searchState = vi.hoisted(() => ({
  query: '',
  results: [] as Array<{ id: string; path: string; title: string; section: string }>,
  suggestion: null as string | null,
  setQuery: vi.fn((value: string) => {
    searchState.query = value
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...(actual as object), useNavigate: () => navigate }
})

vi.mock('../../tech-docs-generator/src/hooks/useSearch', async () => {
  const actual = await vi.importActual('../../tech-docs-generator/src/hooks/useSearch')
  return { ...(actual as object), useSearch: () => searchState }
})

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value })
}

beforeEach(() => {
  searchState.query = ''
  searchState.results = []
  searchState.suggestion = null
  searchState.setQuery.mockClear()
  navigate.mockClear()
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('component branch coverage', () => {
  it('covers reading progress zero-height and scrolled branches', () => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 800,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    const first = render(<ReadingProgress />)
    fireEvent.scroll(window)
    fireEvent.resize(window)
    const firstBar = first.container.querySelector('.h-full') as HTMLElement | null
    expect(firstBar).not.toBeNull()
    expect(firstBar?.style.width).toBe('0%')
    first.unmount()

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 600 })
    const second = render(<ReadingProgress />)
    fireEvent.scroll(window)
    fireEvent.resize(window)
    const secondBar = second.container.querySelector('.h-full') as HTMLElement | null
    expect(secondBar).not.toBeNull()
    // scrollable = 2000 - 800 = 1200; progress = 600/1200 → 50%
    expect(secondBar?.style.width).toBe('50%')
    second.unmount()
  })

  it('hides breadcrumbs on home and labels known/unknown routes', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs />
      </MemoryRouter>,
    )
    expect(screen.queryByLabelText('Home')).toBeNull()
    unmount()

    render(
      <MemoryRouter initialEntries={['/deployment']}>
        <Breadcrumbs />
      </MemoryRouter>,
    )
    expect(screen.getByText('Deployment').textContent).toBe('Deployment')

    render(
      <MemoryRouter initialEntries={['/not-a-real-route']}>
        <Breadcrumbs />
      </MemoryRouter>,
    )
    expect(screen.getByText('Page').textContent).toBe('Page')
  })

  it('toggles back-to-top visibility and scrolls to the top', async () => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    setScrollY(0)
    render(<BackToTop />)

    expect(screen.queryByLabelText('Back to top')).toBeNull()

    setScrollY(401)
    fireEvent.scroll(window)
    const button = await screen.findByLabelText('Back to top')
    fireEvent.click(button)

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })

    setScrollY(1)
    fireEvent.scroll(window)
    await waitFor(() => expect(screen.queryByLabelText('Back to top')).toBeNull())
  })

  it('shows copy success and recovers from clipboard failure', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    render(<CopyButton content="copy me" />)

    fireEvent.click(screen.getByLabelText('Copy to clipboard'))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('copy me'))

    writeText.mockRejectedValueOnce(new Error('clipboard denied'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    fireEvent.click(screen.getByLabelText('Copy to clipboard'))
    await waitFor(() => expect(consoleError).toHaveBeenCalled())
    consoleError.mockRestore()
  })

  it('shows tooltip content on pointer and keyboard focus', () => {
    render(<Tooltip content="More context">Evidence</Tooltip>)
    const trigger = screen.getByText('Evidence')

    fireEvent.mouseEnter(trigger.parentElement as HTMLElement)
    expect(screen.getByText('More context').textContent).toBe('More context')

    fireEvent.mouseLeave(trigger.parentElement as HTMLElement)
    fireEvent.focus(trigger.parentElement as HTMLElement)
    expect(screen.getByText('More context').textContent).toBe('More context')
  })

  it('builds table of contents links and scrolls to headings', async () => {
    const scrollIntoView = vi.fn()
    const observe = vi.fn()
    const disconnect = vi.fn()
    class MockIntersectionObserver {
      constructor(private readonly callback: IntersectionObserverCallback) {}
      observe = observe
      unobserve = vi.fn()
      disconnect = disconnect
      takeRecords = vi.fn(() => [])
      root = null
      rootMargin = ''
      thresholds = []
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

    document.body.innerHTML = '<h2 id="first">First</h2><h3 id="second">Second</h3>'
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      value: scrollIntoView,
    })

    render(<TableOfContents />)

    await screen.findByRole('link', { name: 'First' })
    expect(screen.getByRole('link', { name: 'Second' }).getAttribute('href')).toBe('#second')
    expect(observe).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'First' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
    // Missing heading id → optional chain no-op
    document.getElementById('first')?.remove()
    fireEvent.click(screen.getByRole('link', { name: 'First' }))
  })

  it('returns null while the table of contents has no headings', () => {
    document.body.innerHTML = '<p>no headings</p>'
    const { container } = render(<TableOfContents />)
    expect(container.querySelector('nav')).toBeNull()
  })

  it('renders command palette empty, suggestion, and result states', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { rerender, unmount } = render(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={onClose} />
      </MemoryRouter>,
    )

    expect(screen.queryByPlaceholderText('Search documentation...')).toBeNull()
    expect(searchState.setQuery).toHaveBeenCalledWith('')

    searchState.query = 'zzzz'
    searchState.suggestion = 'Overview'
    rerender(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()
    expect(screen.getByText('Overview').textContent).toBe('Overview')
    fireEvent.click(screen.getByText('Overview'))
    expect(searchState.setQuery).toHaveBeenCalledWith('Overview')

    searchState.query = 'api'
    searchState.suggestion = null
    searchState.results = [{ id: 'api', path: '/api', title: 'API', section: 'Routes' }]
    rerender(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()
    fireEvent.click(screen.getByText('API'))
    expect(navigate).toHaveBeenCalledWith('/api')
    expect(onClose).toHaveBeenCalled()
    unmount()
  })

  it('handles command palette keyboard shortcuts and overlay close', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const openListener = vi.fn()
    document.addEventListener('open-command-palette', openListener)

    const { rerender, unmount } = render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()

    fireEvent.click(document.querySelector('.fixed.inset-0.bg-black\\/40') as HTMLElement)
    expect(onClose.mock.calls.length).toBeGreaterThanOrEqual(1)

    onClose.mockClear()
    rerender(
      <MemoryRouter>
        <CommandPalette isOpen={false} onClose={onClose} />
      </MemoryRouter>,
    )
    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(openListener).toHaveBeenCalled()

    rerender(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(onClose).toHaveBeenCalled()

    document.removeEventListener('open-command-palette', openListener)
    unmount()
  })

  it('updates command palette query from the input and closes via the X control', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    searchState.query = ''
    const { unmount } = render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()

    const input = screen.getByPlaceholderText('Search documentation...')
    fireEvent.change(input, { target: { value: 'security' } })
    expect(searchState.setQuery).toHaveBeenCalledWith('security')

    // X button has no accessible name; click the close control near the kbd.
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[buttons.length - 1]!)
    expect(onClose).toHaveBeenCalled()
    unmount()
  })

  it('closes the command palette overlay with Enter and Space', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const { unmount } = render(
      <MemoryRouter>
        <CommandPalette isOpen onClose={onClose} />
      </MemoryRouter>,
    )
    vi.runAllTimers()

    const overlay = screen.getByLabelText('Close command palette')
    fireEvent.keyDown(overlay, { key: 'Enter' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(overlay, { key: ' ' })
    expect(onClose).toHaveBeenCalledTimes(2)
    fireEvent.keyDown(overlay, { key: 'Tab' })
    expect(onClose).toHaveBeenCalledTimes(2)
    unmount()
  })
})
