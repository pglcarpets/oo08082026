/**
 * Shared Vitest hollow-test heuristics for:
 * - scripts/general/audit-hollow-tests.mjs (whole tests/ tree)
 * - tech-docs-generator/scripts/fake-test-audit.mjs (tech-docs lane)
 */

export const HOLLOW_PATTERNS = [
  { id: "expect-true", re: /expect\s*\(\s*true\s*\)\s*\.\s*toBe\s*\(\s*true\s*\)/ },
  { id: "sole-truthy", re: /expect\s*\([^)]+\)\s*\.\s*toBeTruthy\s*\(\s*\)/ },
  { id: "empty-catch", re: /catch\s*\([^)]*\)\s*\{\s*\}/ },
];

/** Count `expect(` calls — used for zero-expect and sole-truthy checks. */
export function countExpectCalls(source) {
  const matches = source.match(/\bexpect\s*\(/g);
  return matches ? matches.length : 0;
}

/** Active `it(` / `it.each(` blocks — skips `it.skip` / `it.todo`. */
export function countActiveItBlocks(source) {
  const each = (source.match(/\bit\.each\s*\(/g) ?? []).length;
  const plain = (source.match(/(?<![.\w])it\s*\(/g) ?? []).length;
  return each + plain;
}

export function findHollowPatternViolations(source, { file = "" } = {}) {
  const failures = [];

  for (const { id, re } of HOLLOW_PATTERNS) {
    if (id === "sole-truthy") {
      if (re.test(source) && countExpectCalls(source) <= 1) {
        failures.push({ file, reason: id });
      }
      continue;
    }
    if (re.test(source)) {
      failures.push({ file, reason: id });
    }
  }

  if (countActiveItBlocks(source) > 0 && countExpectCalls(source) === 0) {
    failures.push({ file, reason: "zero-expect" });
  }

  return failures;
}
