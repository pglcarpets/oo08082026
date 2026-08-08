import { GeneratedKeyValueTable } from '../components/GeneratedDataTables'
import { LiveRepoSection } from '../components/LiveRepoSection'
import { testCommands as repoTestCommands, testingCommandCards, testingPolicy } from '../data/testingData'
import { Warning as AlertTriangle } from "@phosphor-icons/react";export function Testing() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Testing Strategy</h1>
        <p className="section-subheading">
          Source-backed test scripts and testing policy records generated from repo evidence.
        </p>
      </header>

      {/* Testing policy */}
      <section className="mb-12">
        <LiveRepoSection title="Generated testing policy">
          <GeneratedKeyValueTable
            rows={testingPolicy.map((record) => ({
              label: record.label,
              value: record.fact.value,
              sourcePath: record.fact.sourcePath,
              sourcePointer: record.fact.sourcePointer,
              classification: record.fact.factClassification,
              browserExposure: record.fact.browserExposure,
              verificationMode: record.fact.verificationMode,
              renderSurface: record.fact.renderSurface,
            }))}
          />
        </LiveRepoSection>
      </section>

      {/* Commands */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Test Commands</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testingCommandCards.map(({ scriptName, cmd, desc, scope }) => (
            <div key={scriptName} className="card flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <code className="text-brand-400 text-xs font-mono">{cmd}</code>
                <span className={`badge ${
                  scope === 'Vitest' ? 'bg-yellow-500/15 text-yellow-400' :
                  scope === 'Playwright' ? 'bg-success-500/15 text-success-400' :
                  'bg-brand-500/15 text-brand-400'
                }`}>{scope}</span>
              </div>
              <span className="text-docs-text-subtle text-xs">{desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Release gate */}
      <section className="mb-12">
        <div className="card border-amber-800/40 bg-accent-500/10/10">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-accent-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-accent-400 mb-1">Release Gate</h3>
              <p className="text-xs text-docs-text-muted leading-relaxed mb-3">
                The generated command records identify the current release-gate entry point and source package file.
              </p>
              <GeneratedKeyValueTable
                rows={repoTestCommands
                  .filter((command) => command.scriptName === 'release:gate')
                  .map((command) => ({
                    label: command.scriptName,
                    value: command.command,
                    sourcePath: command.sourcePath,
                    sourcePointer: command.sourcePointer,
                  }))}
              />
            </div>
          </div>
        </div>
      </section>

      <LiveRepoSection title="Live testing policy">
        <h3 className="text-lg font-semibold text-docs-text-strong mb-3 mt-8">Test scripts</h3>
        <GeneratedKeyValueTable
          rows={repoTestCommands.map((command) => ({
            label: command.scriptName,
            value: command.command,
            sourcePath: command.sourcePath,
            sourcePointer: command.sourcePointer,
          }))}
        />
      </LiveRepoSection>
    </div>
  )
}
