import routesJson from '../../../generated-documents/data/routes.json'
import summaryJson from '../../../generated-documents/data/summary.json'
import codeOrganizationJson from '../../../generated-documents/data/code-organization.json'
import type { RouteDomainRecord } from './routeDomainTypes'

export type RouteRecord = {
  path: string
  sourcePath: string
  sourcePointer: string
  aliasPaths: string[]
}

type SummaryPayload = {
  stats: Array<{ label: string; value: string }>
}

const summary = summaryJson as SummaryPayload
const routes = routesJson as RouteRecord[]

export const architectureStats = summary.stats

const codeOrganizationRecords = codeOrganizationJson as RouteDomainRecord[]

export const architectureFeatureModules = codeOrganizationRecords.filter(
  (record) => record.category === 'feature-module',
)

export const architectureTopLevelDirs = codeOrganizationRecords.filter(
  (record) => record.category === 'top-level-dir',
)

export const architectureRoutes = routes.sort((left, right) => left.path.localeCompare(right.path))
