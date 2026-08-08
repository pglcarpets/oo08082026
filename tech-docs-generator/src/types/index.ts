export interface NavItem {
  id: string
  label: string
  icon: string
  path: string
  children?: NavItem[]
}

export interface TechItem {
  id?: string
  name: string
  version: string
  category: string
  description: string
  role: string
  docs?: string
  color: string
  icon?: string
}

export interface CodeExample {
  title: string
  language: string
  code: string
  description?: string
}

export interface Section {
  id: string
  title: string
  content: string
  subsections?: Section[]
}

export interface SearchResult {
  id: string
  title: string
  path: string
  excerpt: string
  section: string
}

export interface Diagram {
  id: string
  title: string
  description: string
  chart: string
}
