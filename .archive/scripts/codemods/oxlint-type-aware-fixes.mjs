#!/usr/bin/env node
/**
 * Conservative Oxlint type-aware repair codemod — dry-run by default.
 *
 * Repairs only transformations whose intent can be proven from the diagnostic
 * and AST shape:
 *   - typescript(no-floating-promises): marks a standalone promise expression
 *     as intentionally detached with `void`.
 *   - typescript(consistent-type-imports): splits named type-only specifiers
 *     into a separate `import type` declaration.
 *   - typescript(no-base-to-string): wraps the diagnosed text conversion with
 *     the shared explicit formatter, which handles primitives, Error messages,
 *     URL-like values, and JSON-serializable objects.
 *
 * It deliberately reports rules that need call-site semantics. In particular,
 * unbound Vitest spies cannot be bound or wrapped without losing spy identity.
 *
 * Usage (from repo root):
 *   node scripts/codemods/oxlint-type-aware-fixes.mjs
 *   node scripts/codemods/oxlint-type-aware-fixes.mjs --write
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import ts from "typescript";
import { REPO_ROOT } from "../lib/repoRoot.mjs";

const write = process.argv.includes("--write");
const LINT_PATHS = [
  "site/app",
  "site/components",
  "site/features",
  "site/lib",
  "site/i18n",
  "site/proxy.ts",
  "site/next.config.js",
  "site/postcss.config.mjs",
  "config/build/next.config.js",
  "config/build/postcss.config.mjs",
  "config/build/playwright.config.ts",
  "config/build/playwrightBaseURL.cjs",
  "config/build/vitest-console-reporter.ts",
  "tests",
];
const FIXABLE_RULES = new Set([
  "typescript(no-floating-promises)",
  "typescript(consistent-type-imports)",
  "typescript(no-base-to-string)",
]);
const STRINGIFIER_MODULE = "@/lib/helpers/toLintSafeString";
const STRINGIFIER_NAME = "toLintSafeString";

function fail(message) {
  process.stderr.write(`oxlint-type-aware-fixes: ${message}\n`);
  process.exit(1);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(record, key) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function getSpan(label) {
  if (!isRecord(label) || !isRecord(label.span)) return null;
  const offset = label.span.offset;
  const length = label.span.length;
  return Number.isInteger(offset) && Number.isInteger(length)
    ? { offset, length }
    : null;
}

function runOxlint() {
  const executable = path.join(
    REPO_ROOT,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "oxlint.cmd" : "oxlint",
  );
  const args = [
    "-c",
    ".oxlintrc.json",
    "--type-aware",
    "--format",
    "json",
    ...LINT_PATHS,
  ];
  const options = { cwd: REPO_ROOT, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 };
  const result = process.platform === "win32"
    ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/c", executable, ...args], options)
    : spawnSync(executable, args, options);

  if (result.error) fail(`could not start oxlint: ${result.error.message}`);
  if (typeof result.stdout !== "string" || result.stdout.trim().length === 0) {
    fail(`oxlint returned no JSON output: ${result.stderr || "unknown error"}`);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    fail(`could not parse oxlint JSON output: ${reason}`);
  }
}

function findSmallestNodeContaining(sourceFile, start, end) {
  let match = null;
  const visit = (node) => {
    const nodeStart = node.getStart(sourceFile);
    const nodeEnd = node.getEnd();
    if (nodeStart > start || nodeEnd < end) return;
    match = node;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return match;
}

function collectImports(sourceFile) {
  const imports = [];
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) imports.push(node);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return imports;
}

function findImportSpecifier(imports, start, end) {
  for (const declaration of imports) {
    const bindings = declaration.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const specifier of bindings.elements) {
      const specifierStart = specifier.getStart();
      const specifierEnd = specifier.getEnd();
      if (specifierStart <= start && specifierEnd >= end) {
        return { declaration, specifier };
      }
    }
  }
  return null;
}

function collectFloatingPromiseFix(sourceFile, diagnostic) {
  const span = getSpan(diagnostic.labels?.[0]);
  if (!span) return { skip: "missing source span" };

  const expression = findSmallestNodeContaining(
    sourceFile,
    span.offset,
    span.offset + span.length,
  );
  if (!expression || expression.getStart(sourceFile) !== span.offset) {
    return { skip: "diagnostic is not a standalone expression" };
  }

  const statement = expression.parent;
  if (!statement || !ts.isExpressionStatement(statement) || statement.expression !== expression) {
    return { skip: "diagnostic is not an expression statement" };
  }
  if (ts.isVoidExpression(expression)) return { skip: "already marked with void" };

  return {
    edit: {
      start: expression.getStart(sourceFile),
      end: expression.getStart(sourceFile),
      text: "void ",
    },
  };
}

function collectTypeImportFix(sourceFile, diagnostic, imports, typeSpecifiers) {
  const span = getSpan(diagnostic.labels?.[0]);
  if (!span) return { skip: "missing source span" };

  const located = findImportSpecifier(imports, span.offset, span.offset + span.length);
  if (!located) return { skip: "diagnostic is not a named import specifier" };

  const declarationStart = located.declaration.getStart(sourceFile);
  const known = typeSpecifiers.get(declarationStart) ?? new Set();
  known.add(located.specifier.getStart(sourceFile));
  typeSpecifiers.set(declarationStart, known);
  return { queued: true };
}

function collectBaseToStringFix(sourceFile, source, diagnostic, stringifierName) {
  const span = getSpan(diagnostic.labels?.[0]);
  if (!span) return { skip: "missing source span" };

  const expression = findSmallestNodeContaining(
    sourceFile,
    span.offset,
    span.offset + span.length,
  );
  if (
    !expression ||
    expression.getStart(sourceFile) !== span.offset ||
    expression.getEnd() !== span.offset + span.length
  ) {
    return { skip: "diagnostic does not describe one complete expression" };
  }

  const text = source.slice(span.offset, span.offset + span.length);
  if (text.startsWith(`${stringifierName}(`)) return { skip: "already explicitly stringified" };
  return {
    edit: {
      start: span.offset,
      end: span.offset + span.length,
      text: `${stringifierName}(${text})`,
    },
  };
}

function materializeTypeImportFixes(sourceFile, imports, typeSpecifiers) {
  const edits = [];
  for (const declaration of imports) {
    const declarationStart = declaration.getStart(sourceFile);
    const typeStarts = typeSpecifiers.get(declarationStart);
    if (!typeStarts || typeStarts.size === 0) continue;

    const clause = declaration.importClause;
    const bindings = clause?.namedBindings;
    if (!clause || !bindings || !ts.isNamedImports(bindings) || clause.name) continue;

    const specifiers = [...bindings.elements];
    const typeOnly = specifiers.filter((specifier) => typeStarts.has(specifier.getStart(sourceFile)));
    const values = specifiers.filter((specifier) => !typeStarts.has(specifier.getStart(sourceFile)));
    if (typeOnly.length === 0) continue;

    const moduleText = declaration.moduleSpecifier.getText(sourceFile);
    const typeText = typeOnly
      .map((specifier) => specifier.getText(sourceFile).replace(/^type\s+/, ""))
      .join(", ");
    const valueText = values.map((specifier) => specifier.getText(sourceFile)).join(", ");
    const replacement = valueText.length > 0
      ? `import { ${valueText} } from ${moduleText};\nimport type { ${typeText} } from ${moduleText};`
      : `import type { ${typeText} } from ${moduleText};`;

    edits.push({
      start: declaration.getStart(sourceFile),
      end: declaration.getEnd(),
      text: replacement,
    });
  }
  return edits;
}

function stringifierNameFor(source) {
  return new RegExp(`\\b${STRINGIFIER_NAME}\\b`).test(source)
    ? "__oxlintStringifier"
    : STRINGIFIER_NAME;
}

function collectStringifierImport(sourceFile, source, imports, stringifierName) {
  if (source.includes(`from "${STRINGIFIER_MODULE}"`) || source.includes(`from '${STRINGIFIER_MODULE}'`)) {
    return null;
  }
  const lastImport = imports.at(-1);
  if (!lastImport) return null;
  const alias = stringifierName === STRINGIFIER_NAME ? "" : ` as ${stringifierName}`;
  return {
    start: lastImport.getEnd(),
    end: lastImport.getEnd(),
    text: `\nimport { ${STRINGIFIER_NAME}${alias} } from "${STRINGIFIER_MODULE}";`,
  };
}

function applyEdits(source, edits) {
  const ordered = [...edits].sort((left, right) => right.start - left.start);
  let result = source;
  let latestStart = Number.POSITIVE_INFINITY;
  for (const edit of ordered) {
    if (edit.end > latestStart) fail("overlapping fixes were generated");
    result = `${result.slice(0, edit.start)}${edit.text}${result.slice(edit.end)}`;
    latestStart = edit.start;
  }
  return result;
}

const report = runOxlint();
if (!isRecord(report) || !Array.isArray(report.diagnostics)) {
  fail("oxlint JSON did not contain a diagnostics array");
}

const byFile = new Map();
const ruleCounts = new Map();
const skipped = new Map();
for (const item of report.diagnostics) {
  if (!isRecord(item)) continue;
  const code = getString(item, "code");
  const filename = getString(item, "filename");
  if (!code || !filename) continue;
  ruleCounts.set(code, (ruleCounts.get(code) ?? 0) + 1);
  if (!FIXABLE_RULES.has(code)) {
    skipped.set(code, (skipped.get(code) ?? 0) + 1);
    continue;
  }
  const diagnostics = byFile.get(filename) ?? [];
  diagnostics.push({ code, labels: Array.isArray(item.labels) ? item.labels : [] });
  byFile.set(filename, diagnostics);
}

let planned = 0;
let applied = 0;
const unresolved = [];
for (const [filename, diagnostics] of [...byFile.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  const absolute = path.resolve(REPO_ROOT, filename);
  const relative = path.relative(REPO_ROOT, absolute);
  if (relative.startsWith("..") || !fs.existsSync(absolute)) {
    unresolved.push(`${filename}: source file is unavailable`);
    continue;
  }

  const source = fs.readFileSync(absolute, "utf8");
  const sourceFile = ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true);
  const imports = collectImports(sourceFile);
  const typeSpecifiers = new Map();
  const stringifierName = stringifierNameFor(source);
  const edits = [];
  let needsStringifierImport = false;

  for (const diagnostic of diagnostics) {
    const result = diagnostic.code === "typescript(no-floating-promises)"
      ? collectFloatingPromiseFix(sourceFile, diagnostic)
      : diagnostic.code === "typescript(consistent-type-imports)"
        ? collectTypeImportFix(sourceFile, diagnostic, imports, typeSpecifiers)
        : collectBaseToStringFix(sourceFile, source, diagnostic, stringifierName);
    if (result.edit) {
      edits.push(result.edit);
      needsStringifierImport ||= diagnostic.code === "typescript(no-base-to-string)";
    }
    if (result.skip) unresolved.push(`${filename}: ${diagnostic.code} — ${result.skip}`);
  }

  edits.push(...materializeTypeImportFixes(sourceFile, imports, typeSpecifiers));
  if (needsStringifierImport) {
    const importEdit = collectStringifierImport(sourceFile, source, imports, stringifierName);
    if (importEdit) edits.push(importEdit);
    else unresolved.push(`${filename}: typescript(no-base-to-string) — could not add formatter import`);
  }
  if (edits.length === 0) continue;

  planned += edits.length;
  process.stdout.write(`  ${write ? "FIX" : "PLAN"} ${filename}: ${edits.length} repair(s)\n`);
  if (write) {
    fs.writeFileSync(absolute, applyEdits(source, edits), "utf8");
    applied += edits.length;
  }
}

process.stdout.write(
  `oxlint-type-aware-fixes: ${planned} repair(s) ${write ? "applied" : "planned (dry run)"}.\n`,
);
for (const [rule, count] of [...skipped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
  process.stdout.write(`  REPORT ${rule}: ${count} require semantic review; not rewritten.\n`);
}
for (const entry of unresolved) process.stdout.write(`  SKIP ${entry}\n`);
for (const [rule, count] of [...ruleCounts.entries()].sort(([left], [right]) => right - left || left.localeCompare(right))) {
  process.stdout.write(`  FOUND ${rule}: ${count}\n`);
}
if (!write) process.stdout.write("oxlint-type-aware-fixes: dry run only — re-run with --write to apply.\n");
