function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|')
}

function table(rows) {
  if (rows.length === 0) return '_No records._\n'
  const headers = Object.keys(rows[0])
  const lines = [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ]

  for (const row of rows) {
    lines.push(`| ${headers.map((header) => escapeCell(row[header] ?? '')).join(' | ')} |`)
  }

  return `${lines.join('\n')}\n`
}

function sourcesSection(sources) {
  const rows = sources.map((source) => ({
    Path: `\`${source.sourcePath}\``,
    Kind: `\`${source.sourceKind}\``,
    Pointer: `\`${source.sourcePointer}\``,
  }))
  return `## Sources\n\n${table(rows)}`
}

function domainTable(records) {
  return table(
    records.map((record) => ({
      'Fact ID': `\`${record.id}.value\``,
      Category: record.category,
      Label: record.label,
      Value: escapeCell(record.value),
      Source: `\`${record.sourcePath}\` \`${record.sourcePointer}\``,
    })),
  )
}

export function renderMarkdownOutputs(model, jsonOutputs) {
  const docs = {}

  docs['markdown/overview/index.md'] =
    `# Overview\n\n` +
    `Generated documentation for the Oando Platform tech stack.\n\n` +
    `## Summary\n\n` +
    table([
      { 'Fact ID': '`overview.dependencies`', Metric: '`Dependencies`', Value: String(model.summary.dependencies), Source: '`_generated`' },
      { 'Fact ID': '`overview.commands`', Metric: '`Commands`', Value: String(model.summary.commands), Source: '`_generated`' },
      { 'Fact ID': '`overview.routes`', Metric: '`Routes`', Value: String(model.summary.routes), Source: '`_generated`' },
      { 'Fact ID': '`overview.api`', Metric: '`API`', Value: String(model.summary.api), Source: '`_generated`' },
      { 'Fact ID': '`overview.features`', Metric: '`Features`', Value: String(model.summary.features), Source: '`_generated`' },
    ]) +
    sourcesSection(model.sources)

  docs['markdown/dependencies/index.md'] = `# Dependencies\n\n${table(
    model.dependencies.map((record) => ({
      'Fact ID': `\`${record.id}\``,
      Label: record.label,
      Value: record.fact.value,
      Source: `\`${record.fact.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/commands/index.md'] = `# Commands\n\n${table(
    model.commands.map((record) => ({
      'Fact ID': `\`${record.id}.command\``,
      Package: record.packageName,
      Script: record.scriptName,
      Command: record.command,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/routes-and-api/routes.md'] = `# Routes\n\n${table(
    model.routes.map((record) => ({
      'Fact ID': `\`${record.id}.route\``,
      Route: record.path,
      Source: `\`${record.sourcePath}\``,
      Aliases: record.aliasPaths.join(', ') || '-',
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/routes-and-api/api.md'] = `# API\n\n${table(
    model.api.map((record) => ({
      'Fact ID': `\`${record.id}.method\``,
      Route: record.path,
      Method: record.method,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/environment/index.md'] = `# Environment\n\n${table(
    model.environment.map((record) => ({
      'Fact ID': `\`${record.name}.env\``,
      Name: record.name,
      Usages: record.usages.length,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/database/index.md'] = `# Database\n\n## Tables\n\n${table(
    model.database.schema.tables.map((record) => ({
      'Fact ID': `\`${record.name}.table\``,
      Table: record.name,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n## Migrations\n\n${table(
    model.database.migrations.map((record) => ({
      'Fact ID': `\`${record.path}.migration\``,
      Migration: record.path,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/features/index.md'] = `# Features\n\n${table(
    model.features.map((record) => ({
      'Fact IDs': `\`${record.slug}.slug\`, \`${record.slug}.title\`, \`${record.slug}.tagline\``,
      Slug: record.slug,
      Title: record.title,
      Tagline: record.tagline,
      Source: `\`${record.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/testing/index.md'] = `# Testing\n\n${table(
    model.testingPolicy.map((record) => ({
      'Fact ID': `\`${record.id}\``,
      Policy: record.label,
      Value: record.fact.value,
      Source: `\`${record.fact.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/testing/coverage.md'] = `# Coverage\n\n${table(
    model.testingPolicy.map((record) => ({
      'Fact ID': `\`${record.id}\``,
      Policy: record.label,
      Value: record.fact.value,
      Source: `\`${record.fact.sourcePath}\``,
    })),
  )}\n${sourcesSection(model.sources)}`

  docs['markdown/build-and-deploy/index.md'] = `# Build And Deploy\n\n${table([
    { 'Fact ID': '`build.outDir`', Value: 'generated-documents/site', Source: '`_generated`' },
    { 'Fact ID': '`build.syncCss`', Value: 'generated-documents/data/css/', Source: '`_generated`' },
  ])}\n${sourcesSection(model.sources)}`

  docs['markdown/governance/provenance.md'] = `# Provenance\n\n${table([
    { 'Fact ID': '`provenance.total`', Value: String(jsonOutputs['_accuracy.json'].totalFactualFields), Source: '`_accuracy.json`' },
    { 'Fact ID': '`provenance.exact`', Value: String(jsonOutputs['_accuracy.json'].exactSourceMatches), Source: '`_accuracy.json`' },
  ])}\n${sourcesSection(model.sources)}`

  docs['markdown/governance/unsupported.md'] = `# Unsupported\n\nNo claim inventory is published. Unsupported claims remain explicit unknown gaps in live model records.\n\n${sourcesSection(model.sources)}`

  docs['markdown/architecture/index.md'] = `# Architecture\n\n${table([
    { 'Fact ID': '`architecture.rootScripts`', Value: 'tech-docs-generator/scripts/', Source: '`_generated`' },
    { 'Fact ID': '`architecture.separateVite`', Value: 'tech-docs-generator/', Source: '`_generated`' },
    { 'Fact ID': '`architecture.generatedOutput`', Value: 'generated-documents/', Source: '`_generated`' },
  ])}\n${sourcesSection(model.sources)}`
  docs['markdown/architecture/repository-structure.md'] = `# Repository Structure\n\n${table([
    { 'Fact ID': '`architecture.rootScripts`', Value: 'tech-docs-generator/scripts/', Source: '`_generated`' },
    { 'Fact ID': '`architecture.separateVite`', Value: 'tech-docs-generator/', Source: '`_generated`' },
    { 'Fact ID': '`architecture.generatedOutput`', Value: 'generated-documents/', Source: '`_generated`' },
  ])}\n${sourcesSection(model.sources)}`

  docs['markdown/workflows/index.md'] = `# Workflows\n\n${domainTable(model.workflows)}\n${sourcesSection(model.sources)}`
  docs['markdown/security/index.md'] = `# Security\n\n${domainTable(model.security)}\n${sourcesSection(model.sources)}`
  docs['markdown/performance/index.md'] = `# Performance\n\n${domainTable(model.performance)}\n${sourcesSection(model.sources)}`
  docs['markdown/code-organization/index.md'] = `# Code Organization\n\n${domainTable(model.codeOrganization)}\n${sourcesSection(model.sources)}`

  return docs
}
