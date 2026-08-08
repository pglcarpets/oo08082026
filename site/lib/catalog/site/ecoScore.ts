/** Bulk catalog seed uses 5 as a mid-scale default — not audited Eco-Score data. */
export const LEGACY_PLACEHOLDER_ECO_SCORE = 5;

export function resolveDisplayEcoScore(input: {
  specs?: { sustainability_score?: number } | null;
  metadata?: { sustainabilityScore?: number } | null;
}): number | undefined {
  const fromSpecs = input.specs?.sustainability_score;
  const fromMeta = input.metadata?.sustainabilityScore;
  const raw =
    typeof fromSpecs === "number" && Number.isFinite(fromSpecs)
      ? fromSpecs
      : typeof fromMeta === "number" && Number.isFinite(fromMeta)
        ? fromMeta
        : undefined;

  if (raw === undefined) {return undefined;}
  if (raw === LEGACY_PLACEHOLDER_ECO_SCORE) {return undefined;}
  return raw;
}
