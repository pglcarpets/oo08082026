export function renderSearchRecords(model) {
  const records = []

  records.push({
    id: 'overview',
    title: 'Overview',
    path: 'markdown/overview/index.md',
    section: 'Overview',
    excerpt: 'Generated documentation for the Oando Platform tech stack.',
    factIds: ['overview.commands', 'overview.dependencies', 'overview.features'],
  })

  for (const record of model.dependencies.slice(0, 8)) {
    records.push({
      id: record.id,
      title: record.label,
      path: 'markdown/dependencies/index.md',
      section: 'Dependencies',
      excerpt: record.fact.value,
      factIds: [record.id],
    })
  }

  for (const record of model.routes.slice(0, 8)) {
    records.push({
      id: record.id,
      title: record.path,
      path: 'markdown/routes-and-api/routes.md',
      section: 'Routes',
      excerpt: record.sourcePath,
      factIds: [`${record.id}.route`],
    })
  }

  for (const record of model.features) {
    records.push({
      id: record.slug,
      title: record.title,
      path: 'markdown/features/index.md',
      section: 'Features',
      excerpt: record.summary,
      factIds: [`${record.slug}.slug`, `${record.slug}.title`, `${record.slug}.tagline`],
    })
  }

  const domainPages = [
    { key: 'workflows', path: 'markdown/workflows/index.md', section: 'Workflows', title: 'Development Workflows' },
    { key: 'security', path: 'markdown/security/index.md', section: 'Security', title: 'Security Practices' },
    { key: 'performance', path: 'markdown/performance/index.md', section: 'Performance', title: 'Performance Optimization' },
    {
      key: 'codeOrganization',
      path: 'markdown/code-organization/index.md',
      section: 'Code Organization',
      title: 'Code Organization',
    },
  ]

  for (const page of domainPages) {
    const items = model[page.key]
    records.push({
      id: page.key,
      title: page.title,
      path: page.path,
      section: page.section,
      excerpt: `${items.length} extracted facts from the live repo`,
      factIds: items.slice(0, 4).map((record) => `${record.id}.value`),
    })
  }

  for (const record of (model.deployment ?? []).slice(0, 12)) {
    records.push({
      id: record.id,
      title: record.label,
      path: 'markdown/deployment/index.md',
      section: 'Deployment',
      excerpt: record.value,
      factIds: [record.id],
    })
  }

  for (const record of (model.ci ?? []).slice(0, 8)) {
    records.push({
      id: record.id,
      title: record.label,
      path: 'markdown/deployment/index.md',
      section: 'Deployment',
      excerpt: record.value,
      factIds: [record.id],
    })
  }

  return records
}
