import { GeneratedKeyValueTable, GeneratedSimpleTable } from '../components/GeneratedDataTables'
import { GeneratedStatusCard } from '../components/GeneratedStatusCard'
import { LiveRepoSection } from '../components/LiveRepoSection'
import {
  branchPolicyRecords,
  ciWorkflowRecords,
  dependabotPolicyRecords,
  deploymentBlockers,
  deploymentCommandRecords,
  deploymentEnvironmentVariables,
  deploymentStatusCards,
  handoverDeployContext,
  releaseGateSteps,
  vercelConfigRecords,
} from '../data/deploymentData'
import { Cloud, GitPullRequest, Key, Rocket, HardDrives as Server } from "@phosphor-icons/react";function toTableRows(records: Array<{
  label: string
  value: string
  sourcePath: string
  sourcePointer: string
  factClassification: string
  browserExposure?: string
  verificationMode?: string
  renderSurface?: string | string[]
}>) {
  return records.map((record) => ({
    label: record.label,
    value: record.value,
    sourcePath: record.sourcePath,
    sourcePointer: record.sourcePointer,
    classification: record.factClassification,
    browserExposure: record.browserExposure,
    verificationMode: record.verificationMode,
    renderSurface: record.renderSurface,
  }))
}

export function Deployment() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <header className="mb-8">
        <h1 className="section-heading">Deployment</h1>
        <p className="section-subheading">
          Source-backed deployment, CI, Dependabot, and status records generated from repository evidence.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Deploy status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deploymentStatusCards.map((record) => (
            <GeneratedStatusCard
              key={record.id}
              label={record.label}
              value={record.value}
              classification={record.factClassification}
              verificationMode={record.verificationMode}
              sourcePath={record.sourcePath}
              sourcePointer={record.sourcePointer}
            />
          ))}
        </div>
      </section>

      <section id="vercel" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-docs-surface-strong/10">
            <Cloud size={20} className="text-docs-text" />
          </div>
          <h2 className="text-xl font-bold text-docs-text-strong">Vercel configuration</h2>
        </div>
        <GeneratedKeyValueTable rows={toTableRows(vercelConfigRecords)} />
        {branchPolicyRecords.length > 0 && (
          <>
            <h3 className="text-lg font-semibold text-docs-text-strong mt-8 mb-3">Branch deployment policy</h3>
            <GeneratedKeyValueTable rows={toTableRows(branchPolicyRecords)} />
          </>
        )}
      </section>

      <section id="pipeline" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-warning-500/10">
            <GitPullRequest size={20} className="text-warning-400" />
          </div>
          <h2 className="text-xl font-bold text-docs-text-strong">CI/CD and deploy commands</h2>
        </div>
        <GeneratedKeyValueTable rows={toTableRows(deploymentCommandRecords)} />
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-accent-500/10">
            <Rocket size={20} className="text-accent-400" />
          </div>
          <h2 className="text-xl font-bold text-docs-text-strong">Release gate steps</h2>
        </div>
        <div className="space-y-2">
          {releaseGateSteps.map((record) => (
            <div key={record.id} className="card flex items-center gap-3 py-3">
              <div className="w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {record.label.match(/Step (\d+)/)?.[1] ?? '·'}
              </div>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-docs-text-strong">{record.value}</code>
                <p className="text-xs text-docs-text-subtle break-all">
                  {record.sourcePath} · {record.sourcePointer}
                </p>
              </div>
              <span className="badge bg-docs-surface-strong text-docs-text-muted border border-docs-border-hover flex-shrink-0">
                {record.factClassification}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-brand-500/10">
            <Server size={20} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-docs-text-strong">GitHub Actions workflows</h2>
        </div>
        <GeneratedKeyValueTable rows={toTableRows(ciWorkflowRecords)} />
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Dependabot policy</h2>
        <GeneratedKeyValueTable rows={toTableRows(dependabotPolicyRecords)} />
      </section>

      <section id="env-vars" className="mb-12 scroll-mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-danger-500/10">
            <Key size={20} className="text-danger-400" />
          </div>
          <h2 className="text-xl font-bold text-docs-text-strong">Environment variables</h2>
        </div>
        <p className="text-sm text-docs-text-muted mb-4">
          Generated environment names are shown without secret values, with usage counts and provenance metadata.
        </p>
        <GeneratedSimpleTable
          columns={[
            { key: 'name', header: 'Variable' },
            { key: 'classification', header: 'Classification' },
            { key: 'usageCount', header: 'Usages' },
            { key: 'sourcePath', header: 'Source' },
          ]}
          rows={deploymentEnvironmentVariables.map((record) => ({
            name: record.name,
            classification: record.factClassification ?? 'code-proven',
            usageCount: String(record.usages.length),
            sourcePath: `${record.sourcePath} ${record.sourcePointer}`,
          }))}
        />
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold text-docs-text-strong mb-4">Deploy blockers and handover context</h2>
        {(deploymentBlockers.length > 0 || handoverDeployContext.length > 0) ? (
          <GeneratedKeyValueTable rows={toTableRows([...deploymentBlockers, ...handoverDeployContext])} />
        ) : (
          <p className="text-sm text-docs-text-subtle">No generated deploy blocker records in the current snapshot.</p>
        )}
      </section>

      <LiveRepoSection title="Live deploy configuration">
        <p className="text-sm text-docs-text-muted mb-4">
          Regenerate source-backed deployment records after changing Vercel config, workflows, or package scripts.
        </p>
        <GeneratedKeyValueTable rows={toTableRows(deploymentCommandRecords)} />
      </LiveRepoSection>
    </div>
  )
}
