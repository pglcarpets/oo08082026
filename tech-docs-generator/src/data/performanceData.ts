import performanceJson from '../../../generated-documents/data/performance.json'
import type { RouteDomainRecord } from './routeDomainTypes'

export const performanceRecords = performanceJson as RouteDomainRecord[]
