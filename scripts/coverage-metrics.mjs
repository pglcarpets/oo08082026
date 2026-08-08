/**
 * Shared Istanbul/V8 coverage counters for coverage-final.json.
 * Vitest v8 often omits the `l` map — lines are derived from statementMap + `s`.
 *
 * RULE: never hardcode absolute statement totals, file counts, or historical
 * denominators in callers. Always pass live data from coverage-final.json.
 * Policy gate % lives in coverage-policy.mjs only.
 */

export function pct(n, d) {
  return d ? Math.round((1000 * n) / d) / 10 : 0;
}

/** @returns {{ covered: number, total: number }} */
export function lineCounts(cov) {
  const direct = cov.l || {};
  const directKeys = Object.keys(direct);
  if (directKeys.length > 0) {
    let covered = 0;
    for (const k of directKeys) {
      if (direct[k] > 0) covered++;
    }
    return { covered, total: directKeys.length };
  }

  const stmtMap = cov.statementMap || {};
  const stmts = cov.s || {};
  /** @type {Map<number, boolean>} */
  const byLine = new Map();

  for (const id in stmts) {
    const line = stmtMap[id]?.start?.line;
    if (line === null || line === undefined) continue;
    const hit = stmts[id] > 0;
    byLine.set(line, byLine.get(line) || hit);
  }

  let covered = 0;
  for (const hit of byLine.values()) {
    if (hit) covered++;
  }
  return { covered, total: byLine.size };
}

/** @returns {{ stmtCovered, stmtTotal, fnCovered, fnTotal, brCovered, brTotal, lineCovered, lineTotal }} */
export function fileCounts(cov) {
  const stmts = cov.s || {};
  const fns = cov.f || {};
  const branches = cov.b || {};
  let stmtCovered = 0;
  let stmtTotal = 0;
  let fnCovered = 0;
  let fnTotal = 0;
  let brCovered = 0;
  let brTotal = 0;

  for (const k in stmts) {
    stmtTotal++;
    if (stmts[k] > 0) stmtCovered++;
  }
  for (const k in fns) {
    fnTotal++;
    if (fns[k] > 0) fnCovered++;
  }
  for (const k in branches) {
    for (const h of branches[k]) {
      brTotal++;
      if (h > 0) brCovered++;
    }
  }

  const { covered: lineCovered, total: lineTotal } = lineCounts(cov);

  return {
    stmtCovered,
    stmtTotal,
    fnCovered,
    fnTotal,
    brCovered,
    brTotal,
    lineCovered,
    lineTotal,
  };
}

export function emptyMetrics() {
  return {
    statements: { covered: 0, total: 0, pct: 0 },
    functions: { covered: 0, total: 0, pct: 0 },
    branches: { covered: 0, total: 0, pct: 0 },
    lines: { covered: 0, total: 0, pct: 0 },
  };
}

export function addMetrics(bucket, cov) {
  const c = fileCounts(cov);
  bucket.statements.covered += c.stmtCovered;
  bucket.statements.total += c.stmtTotal;
  bucket.functions.covered += c.fnCovered;
  bucket.functions.total += c.fnTotal;
  bucket.branches.covered += c.brCovered;
  bucket.branches.total += c.brTotal;
  bucket.lines.covered += c.lineCovered;
  bucket.lines.total += c.lineTotal;
}

export function finalizeMetrics(bucket) {
  for (const key of ["statements", "functions", "branches", "lines"]) {
    const m = bucket[key];
    m.pct = pct(m.covered, m.total);
  }
  return bucket;
}

/**
 * Split coverage-final.json into:
 * - full: every instrumented file (includes force-included 0% files)
 * - touched: only files with ≥1 statement hit (what tests actually exercised)
 *
 * This is the usual “tests feel like they cover more than the report” mismatch:
 * headline % is diluted by thousands of zero files in coverage.include.
 */
export function dualRollupFromFinal(covData) {
  const full = emptyMetrics();
  const touched = emptyMetrics();
  let filesFull = 0;
  let filesTouched = 0;
  let filesZero = 0;

  for (const cov of Object.values(covData)) {
    const c = fileCounts(cov);
    filesFull++;
    full.statements.covered += c.stmtCovered;
    full.statements.total += c.stmtTotal;
    full.functions.covered += c.fnCovered;
    full.functions.total += c.fnTotal;
    full.branches.covered += c.brCovered;
    full.branches.total += c.brTotal;
    full.lines.covered += c.lineCovered;
    full.lines.total += c.lineTotal;

    if (c.stmtCovered > 0) {
      filesTouched++;
      touched.statements.covered += c.stmtCovered;
      touched.statements.total += c.stmtTotal;
      touched.functions.covered += c.fnCovered;
      touched.functions.total += c.fnTotal;
      touched.branches.covered += c.brCovered;
      touched.branches.total += c.brTotal;
      touched.lines.covered += c.lineCovered;
      touched.lines.total += c.lineTotal;
    } else if (c.stmtTotal > 0) {
      filesZero++;
    }
  }

  return {
    filesFull,
    filesTouched,
    filesZero,
    full: finalizeMetrics(full),
    touched: finalizeMetrics(touched),
  };
}