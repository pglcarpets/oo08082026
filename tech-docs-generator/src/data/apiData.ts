import apiJson from '../../../generated-documents/data/api.json'

export type ApiRouteRecord = {
  id: string
  method: string
  path: string
  authRole?: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
}

export const apiRoutes = (apiJson as ApiRouteRecord[]).sort((left, right) => {
  if (left.path !== right.path) return left.path.localeCompare(right.path)
  return left.method.localeCompare(right.method)
})
