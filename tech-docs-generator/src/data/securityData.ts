import securityJson from '../../../generated-documents/data/security.json'
import type { RouteDomainRecord } from './routeDomainTypes'

export const securityRecords = securityJson as RouteDomainRecord[]
