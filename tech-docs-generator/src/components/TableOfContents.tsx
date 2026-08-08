import { useState, useEffect } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Wait a brief moment for the page to render
    const timer = setTimeout(() => {
      const elements = Array.from(document.querySelectorAll('h2[id], h3[id]'))
      const items = elements.map((elem) => ({
        id: elem.id,
        text: elem.textContent || '',
        level: Number(elem.tagName.charAt(1))
      }))
      setHeadings(items)
      if (items.length > 0 && !activeId) {
        setActiveId(items[0].id)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, []) // Re-run if location changes, but since this mounts per page, empty deps is fine

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      // Chrome requires unit on every rootMargin length (bare `0` throws).
      { rootMargin: '-20% 0px -80% 0px' }
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-10 self-start hidden xl:block w-56 flex-shrink-0">
      <h4 className="text-xs font-bold text-docs-text-subtle uppercase tracking-widest mb-4">On this page</h4>
      <ul className="space-y-2 border-l border-docs-border">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}>
            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth' })
              }}
              className={`block pl-4 py-1 text-sm transition-all border-l-2 -ml-[0.0625rem] ${
                activeId === heading.id
                  ? 'border-brand-600 text-brand-800 font-medium'
                  : 'border-transparent text-docs-text-muted hover:text-docs-text hover:border-docs-border-hover'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
