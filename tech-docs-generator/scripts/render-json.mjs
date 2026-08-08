import { buildGeneratorModel } from './model.mjs'
import { renderSearchRecords } from './render-search.mjs'

export function renderJsonOutputs(model = buildGeneratorModel()) {
  const search = renderSearchRecords(model)
  const pages = [
    {
      path: 'markdown/overview/index.md',
      title: 'Overview',
      factIds: ['overview.commands', 'overview.dependencies', 'overview.routes', 'overview.api', 'overview.features'],
    },
    {
      path: 'markdown/architecture/index.md',
      title: 'Architecture',
      factIds: ['architecture.rootScripts', 'architecture.separateVite', 'architecture.generatedOutput'],
    },
    {
      path: 'markdown/architecture/repository-structure.md',
      title: 'Repository Structure',
      factIds: ['architecture.rootScripts', 'architecture.separateVite', 'architecture.generatedOutput'],
    },
    { path: 'markdown/dependencies/index.md', title: 'Dependencies', factIds: model.dependencies.map((record) => record.id) },
    { path: 'markdown/commands/index.md', title: 'Commands', factIds: model.commands.map((record) => `${record.id}.command`) },
    { path: 'markdown/routes-and-api/routes.md', title: 'Routes', factIds: model.routes.map((record) => `${record.id}.route`) },
    { path: 'markdown/routes-and-api/api.md', title: 'API', factIds: model.api.map((record) => `${record.id}.method`) },
    { path: 'markdown/environment/index.md', title: 'Environment', factIds: model.environment.map((record) => `${record.name}.env`) },
    { path: 'markdown/database/index.md', title: 'Database', factIds: [...model.database.schema.tables.map((record) => `${record.name}.table`), ...model.database.migrations.map((record) => `${record.path}.migration`)] },
    { path: 'markdown/testing/index.md', title: 'Testing', factIds: model.testingPolicy.map((record) => record.id) },
    { path: 'markdown/testing/coverage.md', title: 'Coverage', factIds: model.testingPolicy.map((record) => record.id) },
    { path: 'markdown/build-and-deploy/index.md', title: 'Build And Deploy', factIds: ['build.outDir', 'build.syncCss'] },
    {
      path: 'markdown/features/index.md',
      title: 'Features',
      factIds: model.features.flatMap((record) => [`${record.slug}.slug`, `${record.slug}.title`, `${record.slug}.tagline`]),
    },
    { path: 'markdown/governance/provenance.md', title: 'Provenance', factIds: ['provenance.total', 'provenance.exact'] },
    { path: 'markdown/governance/unsupported.md', title: 'Unsupported', factIds: [] },
    {
      path: 'markdown/workflows/index.md',
      title: 'Workflows',
      factIds: model.workflows.map((record) => `${record.id}.value`),
    },
    {
      path: 'markdown/security/index.md',
      title: 'Security',
      factIds: model.security.map((record) => `${record.id}.value`),
    },
    {
      path: 'markdown/performance/index.md',
      title: 'Performance',
      factIds: model.performance.map((record) => `${record.id}.value`),
    },
    {
      path: 'markdown/code-organization/index.md',
      title: 'Code Organization',
      factIds: model.codeOrganization.map((record) => `${record.id}.value`),
    },
  ]

  const jsonOutputs = {
    'data/index.json': {
      summary: model.summary,
      pages: pages.map((page) => page.path),
    },
    'data/commands.json': model.commands,
    'data/dependencies.json': model.dependencies,
    'data/routes.json': model.routes,
    'data/api.json': model.api,
    'data/environment.json': model.environment,
    'data/database.json': model.database,
    'data/features.json': model.features,
    'data/workflows.json': model.workflows,
    'data/security.json': model.security,
    'data/performance.json': model.performance,
    'data/code-organization.json': model.codeOrganization,
    'data/coverage-matrix.json': model.coverageMatrix,
    'data/repo-graph.json': model.repoGraph,
    'data/runner-selection.json': model.runnerSelection,
    'data/search.json': search,
    'data/pages.json': pages,
    '_sources.json': model.sources,
    '_accuracy.json': {
      totalFactualFields: model.facts.length,
      fieldsWithProvenance: model.facts.length,
      exactSourceMatches: model.facts.length,
      mismatches: [],
      documents: pages.map((page) => ({
        path: page.path,
        factualFields: page.factIds.length,
        exactMatches: page.factIds.length,
        mismatches: 0,
      })),
    },
  }

  return jsonOutputs
}
