import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass as Search } from "@phosphor-icons/react"
import type { SearchableItem } from '../hooks/useSearch'

interface SearchResultsProps {
  results: SearchableItem[]
  onClose: () => void
}

export function SearchResults({ results, onClose }: SearchResultsProps) {
  const navigate = useNavigate()

  if (results.length === 0) return null

  return (
    <div className="absolute left-3 right-3 top-full mt-1 bg-docs-surface-raised border border-docs-border-hover rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="p-2 space-y-0.5">
        {results.map(result => (
          <button
            key={result.id}
            onClick={() => {
              navigate(result.path)
              onClose()
            }}
            className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-docs-surface-strong transition-colors text-left"
          >
            <Search size={14} className="text-docs-text-subtle mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm text-docs-text font-medium">{result.title}</div>
              <div className="text-xs text-docs-text-subtle">{result.section}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
