import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass as Search, Command, X } from "@phosphor-icons/react"
import { useSearch } from '../hooks/useSearch'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { query, setQuery, results, suggestion } = useSearch()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      const focusTimer = window.setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => window.clearTimeout(focusTimer)
    }
    setQuery('')
    return undefined
  }, [isOpen, setQuery])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        if (isOpen) {
          onClose()
        } else {
          document.dispatchEvent(new CustomEvent('open-command-palette'))
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-6">
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        role="button"
        tabIndex={0}
        aria-label="Close command palette"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClose()
          }
        }}
      />

      <div className="relative w-full max-w-2xl bg-docs-surface-raised border border-docs-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center px-4 py-4 border-b border-docs-border">
          <Search className="text-docs-text-subtle w-5 h-5 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none text-docs-text-strong px-3 focus:outline-none focus:ring-0 placeholder-docs-text-subtle text-lg"
            placeholder="Search documentation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-docs-surface-strong border border-docs-border rounded text-xs text-docs-text-muted font-sans">
              <Command size={12} /> K
            </kbd>
            <button
              onClick={onClose}
              className="p-1 text-docs-text-subtle hover:text-docs-text-strong transition-colors rounded-md hover:bg-docs-surface-strong ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Results */}
        {query.length > 0 && (
          <div className="overflow-y-auto flex-1 p-2">
            {results.length === 0 ? (
              <div className="text-center py-10 text-docs-text-subtle text-sm">
                No results found for "<span className="text-docs-text">{query}</span>"
                {suggestion && (
                  <div className="mt-4">
                    Did you mean: <button
                      onClick={() => setQuery(suggestion)}
                      className="text-brand-400 hover:text-brand-300 underline font-medium transition-colors"
                    >
                      {suggestion}
                    </button>?
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      navigate(result.path)
                      onClose()
                    }}
                    className="w-full flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-brand-500/10 hover:text-brand-400 group transition-colors text-left"
                  >
                    <Search size={16} className="text-docs-text-subtle mt-0.5 flex-shrink-0 group-hover:text-brand-400 transition-colors" />
                    <div>
                      <div className="text-sm text-docs-text font-semibold group-hover:text-brand-400 transition-colors">
                        {result.title}
                      </div>
                      <div className="text-xs text-docs-text-subtle mt-1 line-clamp-1">{result.section}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state hints */}
        {query.length === 0 && (
          <div className="px-6 py-8 text-center text-docs-text-subtle border-t border-docs-border/50">
            <p className="text-sm">Search across architecture, APIs, components, and dependencies.</p>
          </div>
        )}
      </div>
    </div>
  )
}
