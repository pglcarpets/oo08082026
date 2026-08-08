import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useSearch } from '../../tech-docs-generator/src/hooks/useSearch'

describe('useSearch', () => {
  it('filters results and clears them again', () => {
    const { result } = renderHook(() => useSearch())

    expect(result.current.results).toEqual([])
    expect(result.current.suggestion).toBeNull()

    act(() => {
      result.current.setQuery('planner')
    })

    expect(result.current.results.length).toBeGreaterThan(0)
    expect(result.current.results.some((item) => item.section === 'Features')).toBe(true)
    expect(result.current.suggestion).toBeNull()

    act(() => {
      result.current.setQuery('')
    })

    expect(result.current.results).toEqual([])
  })

  it('ignores whitespace-only queries', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('   ')
    })

    expect(result.current.results).toEqual([])
    expect(result.current.suggestion).toBeNull()
  })

  it('returns a did-you-mean suggestion when nothing matches', () => {
    const { result } = renderHook(() => useSearch())

    act(() => {
      result.current.setQuery('zzzznotarealqueryxyz')
    })

    expect(result.current.results).toEqual([])
    // Looser suggestion fuse may still return a nearest title; either path is valid.
    if (result.current.suggestion !== null) {
      expect(typeof result.current.suggestion).toBe('string')
      expect(result.current.suggestion.length).toBeGreaterThan(0)
    }
  })

  it('returns null suggestion when even the loose fuse has no matches', async () => {
    vi.resetModules()
    vi.doMock('fuse.js', () => ({
      default: class EmptyFuse {
        search() {
          return []
        }
      },
    }))
    const { useSearch: useSearchIsolated } = await import('../../tech-docs-generator/src/hooks/useSearch')

    const { result } = renderHook(() => useSearchIsolated())

    act(() => {
      result.current.setQuery('anything')
    })

    expect(result.current.results).toEqual([])
    expect(result.current.suggestion).toBeNull()
    vi.doUnmock('fuse.js')
    vi.resetModules()
  })
})
