import { GENERATED_ROOT_DIR } from './output-contract.mjs'

export const sourcePolicy = {
  dependencies: {
    precedence: [
      { sourceKind: 'package-manifest', label: 'package.json manifests', mode: 'requested-range' },
      { sourceKind: 'lockfile', label: 'pnpm-lock.yaml', mode: 'resolved-version' },
    ],
    conflictMode: 'reject-mismatch',
  },
  commands: {
    precedence: [{ sourceKind: 'package-script', label: 'package.json scripts', mode: 'authoritative' }],
    conflictMode: 'reject-mismatch',
  },
  routes: {
    precedence: [
      { sourceKind: 'page-file', label: 'site/app/**/page.tsx', mode: 'proof' },
      { sourceKind: 'route-contract', label: 'site/platform/route-contract.json', mode: 'supplemental-metadata' },
    ],
    conflictMode: 'reject-mismatch',
  },
  api: {
    precedence: [
      { sourceKind: 'route-file', label: 'site/app/api/**/route.ts', mode: 'proof' },
      { sourceKind: 'api-contract', label: 'site/platform/route-contract.json', mode: 'supplemental-metadata' },
    ],
    conflictMode: 'reject-mismatch',
  },
  environment: {
    precedence: [
      { sourceKind: 'env-example', label: '.env.example', mode: 'documented-names' },
      { sourceKind: 'env-reader', label: 'env readers', mode: 'usage' },
      { sourceKind: 'env-validator', label: 'env validators', mode: 'required-status' },
    ],
    conflictMode: 'reject-mismatch',
  },
  database: {
    precedence: [
      { sourceKind: 'migration', label: 'migrations', mode: 'history' },
      { sourceKind: 'drizzle-schema', label: 'site/platform/drizzle/schema.ts', mode: 'current-state' },
      { sourceKind: 'generated-supabase-types', label: 'generated Supabase types', mode: 'external-state' },
    ],
    conflictMode: 'reject-mismatch',
  },
  deployment: {
    precedence: [
      { sourceKind: 'vercel-config', label: 'vercel.json', mode: 'checked-in-config' },
      { sourceKind: 'workflow-file', label: '.github/workflows/*.yml', mode: 'workflow-proof' },
      { sourceKind: 'package-script', label: 'package.json scripts', mode: 'command-proof' },
      { sourceKind: 'handover-note', label: 'docs/Plan.md', mode: 'dashboard-only' },
    ],
    conflictMode: 'reject-mismatch',
  },
  ci: {
    precedence: [
      { sourceKind: 'workflow-file', label: '.github/workflows/*.yml', mode: 'workflow-proof' },
      { sourceKind: 'package-script', label: 'package.json scripts', mode: 'command-proof' },
      { sourceKind: 'handover-note', label: 'docs/Plan.md', mode: 'status-note' },
    ],
    conflictMode: 'reject-mismatch',
  },
  dependabot: {
    precedence: [{ sourceKind: 'dependabot-config', label: '.github/dependabot.yml', mode: 'policy' }],
    conflictMode: 'reject-mismatch',
  },
  ai: {
    precedence: [
      { sourceKind: 'source-module', label: 'AI source modules', mode: 'current-state' },
      { sourceKind: 'api-route', label: 'AI route handlers', mode: 'route-proof' },
      { sourceKind: 'env-example', label: '.env.example', mode: 'env-names' },
    ],
    conflictMode: 'reject-mismatch',
  },
  theme: {
    precedence: [
      { sourceKind: 'theme-token-file', label: 'site/focss/base/tokens/palette.css', mode: 'design-tokens' },
      { sourceKind: 'theme-token-file', label: 'site/focss/base/tokens/semantic.css', mode: 'design-tokens' },
      { sourceKind: 'generated-css-manifest', label: `${GENERATED_ROOT_DIR}/data/css/manifest.json`, mode: 'sync-output' },
    ],
    conflictMode: 'reject-mismatch',
  },
  failures: {
    precedence: [
      { sourceKind: 'failures-log', label: 'Failures.md', mode: 'live-status' },
      { sourceKind: 'handover-note', label: 'docs/Plan.md', mode: 'handover-status' },
    ],
    conflictMode: 'reject-mismatch',
  },
  handover: {
    precedence: [{ sourceKind: 'handover-note', label: 'docs/Plan.md', mode: 'handover-status' }],
    conflictMode: 'reject-mismatch',
  },
  'docs-health': {
    precedence: [
      { sourceKind: 'readme-doc', label: 'README.md', mode: 'operational-doc' },
      { sourceKind: 'runbook-doc', label: 'README.md / OPERATIONS_RUNBOOK.md', mode: 'operational-doc' },
      { sourceKind: 'plan-pack', label: 'plans/**', mode: 'plan-contract' },
      { sourceKind: 'architecture-doc', label: 'docs/architecture/**', mode: 'reference-doc' },
      { sourceKind: 'api-doc', label: 'docs/api/**', mode: 'reference-doc' },
      { sourceKind: 'renderer-accuracy-report', label: 'renderer accuracy report', mode: 'build-output-health' },
      { sourceKind: 'generated-manifest', label: `${GENERATED_ROOT_DIR}/docs/_manifest.json`, mode: 'build-output-health' },
      { sourceKind: 'fake-test-audit', label: 'fake-test audit result shape', mode: 'build-output-health' },
    ],
    conflictMode: 'reject-mismatch',
  },
  coverage: {
    precedence: [
      { sourceKind: 'coverage-report', label: 'coverage summary report', mode: 'coverage-evidence' },
      { sourceKind: 'coverage-summary', label: 'coverage-summary.json', mode: 'coverage-evidence' },
      { sourceKind: 'docs-gate', label: 'tech-docs:gate', mode: 'gate-evidence' },
      { sourceKind: 'test-run', label: 'test:coverage', mode: 'test-evidence' },
    ],
    conflictMode: 'reject-mismatch',
  },
  features: {
    precedence: [{ sourceKind: 'typed-feature-metadata', label: 'typed feature metadata', mode: 'authoritative' }],
    conflictMode: 'reject-mismatch',
  },
  build: {
    precedence: [{ sourceKind: 'checked-in-script-or-config', label: 'scripts and config', mode: 'authoritative' }],
    conflictMode: 'reject-mismatch',
  },
  structure: {
    precedence: [{ sourceKind: 'allowlisted-path', label: 'allowlisted POSIX path', mode: 'authoritative' }],
    conflictMode: 'reject-unsupported',
  },
}

export const sourceKinds = Array.from(
  new Set(Object.values(sourcePolicy).flatMap((policy) => policy.precedence.map((entry) => entry.sourceKind))),
)

export function getPolicy(domain) {
  const policy = sourcePolicy[domain]
  if (!policy) {
    throw new Error(`Unknown source policy domain: ${domain}`)
  }
  return policy
}

export function getSourceRank(domain, sourceKind) {
  const policy = getPolicy(domain)
  const rank = policy.precedence.findIndex((entry) => entry.sourceKind === sourceKind)
  if (rank === -1) {
    throw new Error(`Unsupported source kind "${sourceKind}" for domain "${domain}"`)
  }
  return rank
}

export function selectPreferredSource(domain, candidates) {
  const policy = getPolicy(domain)
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error(`No source candidates supplied for domain "${domain}"`)
  }

  const ranked = candidates.map((candidate) => ({
    candidate,
    rank: getSourceRank(domain, candidate.sourceKind),
  }))

  ranked.sort((left, right) => left.rank - right.rank)

  const bestRank = ranked[0].rank
  const winners = ranked.filter((entry) => entry.rank === bestRank).map((entry) => entry.candidate)
  const winner = winners[0]

  for (const loser of winners.slice(1)) {
    if (
      loser.value !== winner.value ||
      loser.sourcePath !== winner.sourcePath ||
      loser.sourcePointer !== winner.sourcePointer
    ) {
      throw new Error(`Source conflict in domain "${domain}"`)
    }
  }

  if (policy.conflictMode === 'reject-mismatch') {
    const conflicting = ranked.slice(1).find((entry) => {
      return (
        entry.candidate.value !== winner.value &&
        entry.candidate.sourcePath === winner.sourcePath &&
        entry.candidate.sourcePointer === winner.sourcePointer
      )
    })

    if (conflicting) {
      throw new Error(`Source conflict in domain "${domain}"`)
    }
  }

  return winner
}
