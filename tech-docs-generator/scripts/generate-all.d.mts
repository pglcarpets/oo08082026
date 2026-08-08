export type GenerateAllResult = {
  model: unknown
  docs: unknown
  data: unknown
  publication: unknown
}

export function generateAll(options?: {
  repoRoot?: string
}): Promise<GenerateAllResult>
