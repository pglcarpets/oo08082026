import { CaretRight as ChevronRight, House as Home } from "@phosphor-icons/react"
import { Link, useLocation } from 'react-router-dom'

const routeNames: Record<string, string> = {
  '/tech-stack': 'Tech Stack',
  '/architecture': 'Architecture',
  '/features': 'Features',
  '/code-organization': 'Code Organization',
  '/database': 'Database',
  '/api': 'API Design',
  '/testing': 'Testing',
  '/deployment': 'Deployment',
  '/security': 'Security',
  '/performance': 'Performance',
  '/workflows': 'Workflows'
}

export function Breadcrumbs() {
  const location = useLocation()
  
  if (location.pathname === '/') {
    return null
  }

  const routeName = routeNames[location.pathname] || 'Page'

  return (
    <nav
      className="mb-8 flex items-center gap-2 pt-2 text-sm text-docs-text-muted"
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className="flex items-center rounded-md p-0.5 text-docs-text-muted transition-colors hover:text-brand-700"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>
      <ChevronRight className="h-4 w-4 shrink-0 text-docs-text-subtle" aria-hidden />
      <span className="font-medium text-docs-text-strong">{routeName}</span>
    </nav>
  )
}
