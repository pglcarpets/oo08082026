import type { NavItem } from '../types'

export const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'Home',
    path: '/',
  },
  {
    id: 'tech-stack',
    label: 'Tech Stack',
    icon: 'Layers',
    path: '/tech-stack',
    // Anchors must match TechStack.tsx h2 ids (from live categories).
    children: [
      { id: 'tech-stack-product-surfaces', label: 'Product surfaces', icon: 'Monitor', path: '/tech-stack#product-surfaces' },
      { id: 'database-boundaries', label: 'Database boundaries', icon: 'Database', path: '/tech-stack#database-boundaries' },
      { id: 'active-blockers', label: 'Active blockers', icon: 'Shield', path: '/tech-stack#active-blockers' },
      { id: 'package-inventory', label: 'Package inventory', icon: 'Box', path: '/tech-stack#package-inventory' },
      { id: 'runtime', label: 'Runtime', icon: 'Monitor', path: '/tech-stack#runtime' },
      { id: 'dev-tooling', label: 'Dev tooling', icon: 'Wrench', path: '/tech-stack#dev-tooling' },
      { id: 'docs-package', label: 'Docs package', icon: 'Box', path: '/tech-stack#docs-package' },
    ],
  },
  {
    id: 'architecture',
    label: 'Architecture',
    icon: 'GitBranch',
    path: '/architecture',
    children: [
      { id: 'app-structure', label: 'App Structure', icon: 'FolderTree', path: '/architecture#app-structure' },
      { id: 'data-flow', label: 'Data Flow', icon: 'ArrowRight', path: '/architecture#data-flow' },
      { id: 'auth-flow', label: 'Auth Flow', icon: 'Lock', path: '/architecture#auth-flow' },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    icon: 'Puzzle',
    path: '/features',
    children: [
      { id: 'features-product-surfaces', label: 'Product surfaces', icon: 'Monitor', path: '/features#product-surfaces' },
      { id: 'auth-roles', label: 'Auth roles', icon: 'Shield', path: '/features#auth-roles' },
      { id: 'admin', label: 'Admin', icon: 'Settings', path: '/features#admin' },
      { id: 'planner', label: 'Planner', icon: 'PenTool', path: '/features#planner' },
      { id: 'studio', label: 'Studio', icon: 'Box', path: '/features#studio' },
    ],
  },
  {
    id: 'code-organization',
    label: 'Code Organization',
    icon: 'FolderOpen',
    path: '/code-organization',
  },
  {
    id: 'database',
    label: 'Database',
    icon: 'Database',
    path: '/database',
    children: [
      { id: 'projects', label: 'Projects', icon: 'Server', path: '/database#projects' },
      { id: 'schema', label: 'Schema', icon: 'Table', path: '/database#schema' },
      { id: 'migrations', label: 'Migrations', icon: 'GitMerge', path: '/database#migrations' },
      { id: 'drizzle', label: 'Drizzle ORM', icon: 'Code', path: '/database#drizzle' },
    ],
  },
  {
    id: 'api',
    label: 'API Design',
    icon: 'Globe',
    path: '/api',
    children: [
      { id: 'routes', label: 'Routes', icon: 'Route', path: '/api#routes' },
      { id: 'patterns', label: 'Patterns', icon: 'Repeat', path: '/api#patterns' },
    ],
  },
  {
    id: 'testing',
    label: 'Testing',
    icon: 'TestTube',
    path: '/testing',
    children: [
      { id: 'unit', label: 'Unit Tests', icon: 'CheckSquare', path: '/testing#unit' },
      { id: 'e2e', label: 'E2E Tests', icon: 'Play', path: '/testing#e2e' },
      { id: 'coverage', label: 'Coverage', icon: 'BarChart', path: '/testing#coverage' },
    ],
  },
  {
    id: 'deployment',
    label: 'Deployment',
    icon: 'Rocket',
    path: '/deployment',
    children: [
      { id: 'pipeline', label: 'Pipeline', icon: 'GitPullRequest', path: '/deployment#pipeline' },
      { id: 'vercel', label: 'Vercel', icon: 'Cloud', path: '/deployment#vercel' },
      { id: 'env-vars', label: 'Env Variables', icon: 'Key', path: '/deployment#env-vars' },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'Shield',
    path: '/security',
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: 'Zap',
    path: '/performance',
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: 'GitCommit',
    path: '/workflows',
  },
]
