import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { getSourcePackageRoot } from './output-contract.mjs'

const require = createRequire(import.meta.url)

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, '..', '..')
const ts = require('typescript')
const packageRoot = getSourcePackageRoot(repoRoot)

const scope = {
  pagesDir: path.join(packageRoot, 'src', 'pages'),
  techStack: path.join(packageRoot, 'src', 'data', 'techStack.ts'),
  useSearch: path.join(packageRoot, 'src', 'hooks', 'useSearch.ts'),
  testsDir: path.join(packageRoot, 'tests'),
  readmes: [
    path.join(packageRoot, 'README.md'),
    path.join(packageRoot, 'Readme_Techstack.md'),
  ],
}

const STYLE_ATTRS = new Set(['className', 'class', 'style'])
const UI_TEXT_ATTRS = new Set(['title', 'placeholder', 'aria-label', 'aria-labelledby', 'alt'])
const PATH_ATTRS = new Set(['href', 'src', 'to', 'path'])
const UI_QUERY_CALLS = new Set([
  'getByRole',
  'queryByRole',
  'getAllByRole',
  'findByRole',
  'getByText',
  'queryByText',
  'getAllByText',
  'findByText',
  'getByLabelText',
  'queryByLabelText',
  'getByPlaceholderText',
  'queryByPlaceholderText',
])
const PLUMBING_CALLS = new Set([
  'readFileSync',
  'resolve',
  'join',
  'dirname',
  'fileURLToPath',
  'mock',
  'hoisted',
])
const UI_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'label', 'span', 'a'])

const claims = []
const seen = new Set()

function toPosix(relPath) {
  return relPath.split(path.sep).join('/')
}

function relative(absPath) {
  return toPosix(path.relative(repoRoot, absPath))
}

function lineCol(sourceFile, node) {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return { line: start.line + 1, column: start.character + 1 }
}

function normalizeText(text) {
  return text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim()
}

function isEmpty(text) {
  return !text || !text.trim()
}

function isRoutePath(text) {
  return /^\/[^\s]*$/.test(text) && text.startsWith('/')
}

function isUrl(text) {
  return /^https?:\/\//i.test(text)
}

function looksLikePath(text) {
  return (
    isRoutePath(text) ||
    isUrl(text) ||
    /(?:^|[^\w])(?:\.\.?\/|\/|\\)/.test(text) ||
    /\.(?:md|ts|tsx|json|mjs|js|css|html)\b/i.test(text) ||
    /package\.json|vite\.config\.ts|Readme_Techstack\.md|README\.md|generated-documents/i.test(text)
  )
}

function looksLikeCommand(text) {
  return /\b(?:pnpm|npm|npm\.cmd|vite|tsc|vitest|playwright|node|cd|pnpx|npx)\b/i.test(text)
}

function looksLikeGeneratedToken(text) {
  return looksLikePath(text) || looksLikeCommand(text) || /\b(?:scripts?|routes?|path|outDir|build|dev|test|typecheck)\b/i.test(text)
}

function looksLikeLabel(text) {
  const normalized = normalizeText(text)
  if (!normalized) return false
  if (/[.!?]$/.test(normalized)) return false
  if (normalized.length > 60) return false
  return normalized.split(/\s+/).length <= 6
}

function baseCallName(node) {
  if (ts.isIdentifier(node)) return node.text
  if (ts.isPropertyAccessExpression(node)) {
    const left = baseCallName(node.expression)
    return left ? `${left}.${node.name.text}` : node.name.text
  }
  if (ts.isCallExpression(node)) return baseCallName(node.expression)
  return undefined
}

function isTestUiCall(callName) {
  if (!callName) return false
  return UI_QUERY_CALLS.has(callName.split('.').pop())
}

function isPlumbingCall(callName) {
  if (!callName) return false
  return PLUMBING_CALLS.has(callName.split('.').pop())
}

function claimId(parts) {
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)
}

function addClaim(claim) {
  const key = [
    claim.file,
    String(claim.line),
    String(claim.column),
    claim.classification,
    claim.kind,
    claim.text,
  ].join('|')
  if (seen.has(key)) return
  seen.add(key)
  claims.push({
    id: claimId([claim.file, String(claim.line), String(claim.column), claim.classification, claim.kind, claim.text]),
    ...claim,
    sourcePointers: claim.sourcePointers ?? [
      {
        path: claim.file,
        line: claim.line,
        column: claim.column,
        note: 'claim location',
      },
    ],
  })
}

function classifyTsClaim({ file, key, text, kind, callName, jsxTag, fixture, parentKind: _parentKind }) {
  const isTechStack = file.endsWith('src/data/techStack.ts')
  const isSearch = file.endsWith('src/hooks/useSearch.ts')
  const isTest = file.includes('/tests/')
  const isPage = file.includes('/src/pages/')

  if (kind === 'type-declaration') return 'typed metadata'

  if (isTechStack) {
    if (key === 'color') return 'ui-only'
    if (key === 'description' || key === 'role') return 'unsupported'
    if (key === 'name' || key === 'version' || key === 'category' || key === 'docs') return 'generated fact'
  }

  if (isSearch) {
    if (kind === 'type-declaration') return 'typed metadata'
    if (key === 'id' || key === 'tags') return 'typed metadata'
    if (key === 'path') return 'generated fact'
    if (key === 'title' || key === 'section') return 'ui-only'
    if (key === 'content') return 'unsupported'
    if (key === 'threshold' || key === 'includeScore' || key === 'keys') return 'typed metadata'
  }

  if (isTest) {
    if (isTestUiCall(callName)) return 'ui-only'
    if (isPlumbingCall(callName)) return null
    if (fixture) return 'typed metadata'
    if (key && PATH_ATTRS.has(key)) return looksLikePath(text) ? 'generated fact' : 'ui-only'
    if (key && UI_TEXT_ATTRS.has(key)) return 'ui-only'
    if (looksLikeGeneratedToken(text)) return 'generated fact'
    if (looksLikeLabel(text)) return 'ui-only'
    return 'unsupported'
  }

  if (isPage) {
    if (key && STYLE_ATTRS.has(key)) return null
    if (key && PATH_ATTRS.has(key)) return looksLikePath(text) ? 'generated fact' : 'unsupported'
    if (key && UI_TEXT_ATTRS.has(key)) return 'ui-only'
    if (kind === 'jsx-text') {
      if (jsxTag && UI_TAGS.has(jsxTag) && looksLikeLabel(text)) return 'ui-only'
      if (jsxTag === 'p' || jsxTag === 'li' || jsxTag === 'code' || jsxTag === 'pre') return 'unsupported'
      if (looksLikeGeneratedToken(text)) return 'generated fact'
      return looksLikeLabel(text) ? 'ui-only' : 'unsupported'
    }
    if (kind === 'string' && looksLikeGeneratedToken(text)) return 'generated fact'
    return 'unsupported'
  }

  return looksLikeLabel(text) ? 'ui-only' : 'unsupported'
}

function captureStringClaim({ sourceFile, node, file, key, kind, text, callName, jsxTag, fixture, parentKind }) {
  const normalized = normalizeText(text)
  if (isEmpty(normalized)) return

  const classification = classifyTsClaim({ file, key, text: normalized, kind, callName, jsxTag, fixture, parentKind })
  if (!classification) return

  const { line, column } = lineCol(sourceFile, node)
  addClaim({
    file,
    line,
    column,
    kind,
    classification,
    key: key ?? null,
    callName: callName ?? null,
    jsxTag: jsxTag ?? null,
    text: normalized,
  })
}

function getPropertyName(name) {
  if (!name) return undefined
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return undefined
}

function scanTsFile(absPath) {
  const file = relative(absPath)
  const sourceText = fs.readFileSync(absPath, 'utf8')
  const sourceFile = ts.createSourceFile(absPath, sourceText, ts.ScriptTarget.Latest, true, absPath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)

  function visit(node, ctx) {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
      const { line, column } = lineCol(sourceFile, node)
      addClaim({
        file,
        line,
        column,
        kind: 'type-declaration',
        classification: 'typed metadata',
        key: node.name.text,
        callName: null,
        jsxTag: null,
        text: normalizeText(node.getText(sourceFile)),
      })
    }

    if (ts.isVariableDeclaration(node)) {
      const varName = ts.isIdentifier(node.name) ? node.name.text : undefined
      const fixture = ctx.fixture || Boolean(varName && /mock/i.test(varName))
      if (node.initializer) {
        visit(node.initializer, { ...ctx, varName, fixture })
      }
      return
    }

    if (ts.isPropertyAssignment(node)) {
      const key = getPropertyName(node.name)
      visit(node.initializer, { ...ctx, key })
      return
    }

    if (ts.isShorthandPropertyAssignment(node)) {
      return
    }

    if (ts.isJsxElement(node)) {
      const tag = ts.isIdentifier(node.openingElement.tagName)
        ? node.openingElement.tagName.text
        : node.openingElement.tagName.getText(sourceFile)
      node.children.forEach((child) => visit(child, { ...ctx, jsxTag: tag }))
      return
    }

    if (ts.isJsxSelfClosingElement(node)) {
      return
    }

    if (ts.isJsxExpression(node)) {
      if (node.expression) visit(node.expression, ctx)
      return
    }

    if (ts.isJsxText(node)) {
      captureStringClaim({
        sourceFile,
        node,
        file,
        kind: 'jsx-text',
        text: node.getText(sourceFile),
        key: ctx.key,
        callName: ctx.callName,
        jsxTag: ctx.jsxTag,
        fixture: ctx.fixture,
        parentKind: ctx.parentKind,
      })
      return
    }

    if (ts.isStringLiteralLike(node)) {
      if (ts.isImportDeclaration(node.parent) || ts.isExportDeclaration(node.parent)) return
      if (ts.isLiteralTypeNode(node.parent)) return
      if (ts.isElementAccessExpression(node.parent) && node.parent.expression.getText(sourceFile) === 'process.env') return
      if (ctx.callName && isPlumbingCall(ctx.callName) && !looksLikeGeneratedToken(node.text)) return
      captureStringClaim({
        sourceFile,
        node,
        file,
        kind: 'string',
        text: node.text,
        key: ctx.key,
        callName: ctx.callName,
        jsxTag: ctx.jsxTag,
        fixture: ctx.fixture,
        parentKind: ctx.parentKind,
      })
      return
    }

    if (ts.isNumericLiteral(node)) {
      captureStringClaim({
        sourceFile,
        node,
        file,
        kind: 'number',
        text: node.getText(sourceFile),
        key: ctx.key,
        callName: ctx.callName,
        jsxTag: ctx.jsxTag,
        fixture: ctx.fixture,
        parentKind: ctx.parentKind,
      })
      return
    }

    if (ts.isRegularExpressionLiteral(node)) {
      captureStringClaim({
        sourceFile,
        node,
        file,
        kind: 'regex',
        text: node.getText(sourceFile),
        key: ctx.key,
        callName: ctx.callName,
        jsxTag: ctx.jsxTag,
        fixture: ctx.fixture,
        parentKind: ctx.parentKind,
      })
      return
    }

    if (ts.isCallExpression(node)) {
      const callName = baseCallName(node.expression)
      const nextCtx = { ...ctx, callName }
      node.arguments.forEach((arg) => visit(arg, nextCtx))
      return
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      if (node.body) visit(node.body, ctx)
      return
    }

    if (ts.isParenthesizedExpression(node)) {
      visit(node.expression, ctx)
      return
    }

    ts.forEachChild(node, (child) => visit(child, ctx))
  }

  visit(sourceFile, { file, key: null, callName: null, jsxTag: null, fixture: false, parentKind: null, varName: null })
}

function isFence(line) {
  return /^\s*```/.test(line)
}

function extractInlineCode(line) {
  const out = []
  const regex = /`([^`]+)`/g
  let match
  while ((match = regex.exec(line))) out.push({ text: match[1], index: match.index })
  return out
}

function classifyMarkdownLine(text, codeTokens, lineText) {
  const normalized = normalizeText(text)
  if (!normalized) return null
  if (/^#{1,6}\s+/.test(lineText)) return 'ui-only'
  if (lineText.startsWith('|')) {
    if (codeTokens.some((t) => looksLikeGeneratedToken(t.text))) return 'generated fact'
    return looksLikeLabel(normalized) ? 'ui-only' : 'unsupported'
  }
  if (/^[-*]\s+/.test(normalized) || /^\d+\.\s+/.test(normalized) || /^>\s+/.test(normalized)) {
    if (codeTokens.some((t) => looksLikeGeneratedToken(t.text))) return 'generated fact'
    return looksLikeLabel(normalized) ? 'ui-only' : 'unsupported'
  }
  if (codeTokens.some((t) => looksLikeGeneratedToken(t.text))) return 'generated fact'
  return looksLikeLabel(normalized) ? 'ui-only' : 'unsupported'
}

function scanMarkdownFile(absPath) {
  const file = relative(absPath)
  const sourceText = fs.readFileSync(absPath, 'utf8')
  const lines = sourceText.split(/\r?\n/)
  let inFence = false

  lines.forEach((lineText, index) => {
    const lineNo = index + 1
    if (isFence(lineText)) {
      inFence = !inFence
      return
    }

    const trimmed = lineText.trim()
    if (!trimmed) return

    const inlineCodes = extractInlineCode(lineText)
    const claimText = normalizeText(lineText.replace(/`([^`]+)`/g, '$1'))

    if (inFence) {
      const codeClaims = inlineCodes.filter((token) => looksLikeGeneratedToken(token.text))
      if (codeClaims.length > 0) {
        codeClaims.forEach((token) => {
          addClaim({
            file,
            line: lineNo,
            column: token.index + 1,
            kind: 'markdown-inline-code',
            classification: 'generated fact',
            key: null,
            callName: null,
            jsxTag: null,
            text: normalizeText(token.text),
          })
        })
      }
      return
    }

    const classification = classifyMarkdownLine(claimText, inlineCodes, lineText)
    if (!classification) return

    addClaim({
      file,
      line: lineNo,
      column: 1,
      kind: /^#{1,6}\s+/.test(trimmed)
        ? 'markdown-heading'
        : trimmed.startsWith('|')
          ? 'markdown-table'
          : 'markdown-line',
      classification,
      key: null,
      callName: null,
      jsxTag: null,
      text: claimText,
    })

    inlineCodes.forEach((token) => {
      if (!looksLikeGeneratedToken(token.text)) return
      addClaim({
        file,
        line: lineNo,
        column: token.index + 1,
        kind: 'markdown-inline-code',
        classification: 'generated fact',
        key: null,
        callName: null,
        jsxTag: null,
        text: normalizeText(token.text),
      })
    })
  })
}

function walkFiles(dir, extensions, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(abs, extensions, out)
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      out.push(abs)
    }
  }
  return out
}

function scan() {
  const files = [
    ...walkFiles(scope.pagesDir, ['.tsx']),
    scope.techStack,
    scope.useSearch,
    ...walkFiles(scope.testsDir, ['.ts', '.tsx']),
    ...scope.readmes,
  ]

  const ordered = [...new Set(files)].sort((a, b) => relative(a).localeCompare(relative(b)))
  ordered.forEach((absPath) => {
    if (absPath.endsWith('.md')) scanMarkdownFile(absPath)
    else scanTsFile(absPath)
  })
}

function summarize() {
  const counts = {
    total: claims.length,
    generatedFact: claims.filter((c) => c.classification === 'generated fact').length,
    typedMetadata: claims.filter((c) => c.classification === 'typed metadata').length,
    uiOnly: claims.filter((c) => c.classification === 'ui-only').length,
    unsupported: claims.filter((c) => c.classification === 'unsupported').length,
  }

  const byFile = {}
  for (const claim of claims) {
    const bucket = byFile[claim.file] ??= { total: 0, generatedFact: 0, typedMetadata: 0, uiOnly: 0, unsupported: 0 }
    bucket.total += 1
    if (claim.classification === 'generated fact') bucket.generatedFact += 1
    else if (claim.classification === 'typed metadata') bucket.typedMetadata += 1
    else if (claim.classification === 'ui-only') bucket.uiOnly += 1
    else bucket.unsupported += 1
  }

  const blockers = []
  if (counts.unsupported > 0) {
    blockers.push({
      kind: 'unsupported-claims',
      count: counts.unsupported,
      detail: 'Narrative claims in pages, tests, and readmes have no canonical source inside the scanned scope.',
      examples: claims
        .filter((c) => c.classification === 'unsupported')
        .slice(0, 8)
        .map((c) => `${c.file}:${c.line} ${c.text}`),
    })
  }

  const output = {
    scope: {
      pagesDir: relative(scope.pagesDir),
      techStack: relative(scope.techStack),
      useSearch: relative(scope.useSearch),
      testsDir: relative(scope.testsDir),
      readmes: scope.readmes.map(relative),
    },
    counts,
    byFile,
    blockers,
    claims: claims.sort((a, b) => {
      if (a.file !== b.file) return a.file.localeCompare(b.file)
      if (a.line !== b.line) return a.line - b.line
      if (a.column !== b.column) return a.column - b.column
      if (a.classification !== b.classification) return a.classification.localeCompare(b.classification)
      return a.id.localeCompare(b.id)
    }),
  }

  return { output, counts, blockers }
}

function main() {
  scan()
  const { counts, blockers } = summarize()
  console.log(
    `Claims: ${counts.total} (generated fact ${counts.generatedFact}, typed metadata ${counts.typedMetadata}, ui-only ${counts.uiOnly}, unsupported ${counts.unsupported})`,
  )
  console.log(`Blockers: ${blockers.length ? blockers.length : 0}`)
  if (blockers.length > 0) {
    for (const blocker of blockers) {
      console.log(`- ${blocker.kind}: ${blocker.count}`)
    }
  }
}

main()
