import { useMemo, useState } from 'react'
import Fuse from 'fuse.js'
import searchItemsJson from '../../../generated-documents/data/search-items.json'

export interface SearchableItem {
  id: string
  title: string
  path: string
  content: string
  section: string
  tags?: string[]
}

const searchIndex = searchItemsJson as SearchableItem[]

export function useSearch() {
  const [query, setQuery] = useState('')

  const fuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: ['title', 'content', 'tags'],
        threshold: 0.4,
        includeScore: true,
      }),
    [],
  )

  const suggestionFuse = useMemo(
    () =>
      new Fuse(searchIndex, {
        keys: ['title', 'tags'],
        threshold: 0.7, // looser threshold for typos
        includeScore: true,
      }),
    [],
  )

  const results = useMemo(() => {
    if (!query.trim()) return []
    return fuse
      .search(query)
      .slice(0, 8)
      .map((result) => result.item)
  }, [fuse, query])

  const suggestion = useMemo(() => {
    if (results.length > 0 || !query.trim()) return null
    const matches = suggestionFuse.search(query)
    if (matches.length > 0) {
      return matches[0].item.title
    }
    return null
  }, [results.length, query, suggestionFuse])

  return { query, setQuery, results, suggestion }
}
