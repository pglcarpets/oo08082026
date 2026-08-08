import workflowsJson from '../../../generated-documents/data/workflows.json'
import type { RouteDomainRecord } from './routeDomainTypes'

// Site-workflows support + updated data handling (loader for site vs root; filterable).
// Data sourced via emit-renderer-data + extract-route-domains (site-workflows extended allowlist).
// Per approved plan, use direct generated data loader pattern (no hand facts).
export const workflowRecords = workflowsJson as RouteDomainRecord[]

// Site-specific workflows subset (e.g. site/ package scripts, docs syncs) for dedicated sections.
export const siteWorkflowRecords = workflowRecords.filter(
  (r) => r.sourcePath.startsWith('site/') || r.id.includes('site_') || r.id.includes('docs.')
)
