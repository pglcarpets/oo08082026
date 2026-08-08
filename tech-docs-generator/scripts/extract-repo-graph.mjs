import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractApiRecords } from './extract-api.mjs'
import { extractRouteRecords } from './extract-routes.mjs'
import { comparePaths, normalizeSourceText } from './filesystem.mjs'
import { normalizeRepositoryInput } from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const SCAN_ROOTS = ['site', 'tech-docs-generator']
const graphCache = new Map()

function sourceHash(repoRoot, relativePath) {
  try {
    const content = normalizeSourceText(readFileSync(path.join(repoRoot, relativePath), 'utf8'))
    return `sha256:${createHash('sha256').update(content, 'utf8').digest('hex')}`
  } catch {
    return 'missing'
  }
}

function walkFiles(repoRoot, relativeRoot, predicate, out = []) {
  const absRoot = path.join(repoRoot, relativeRoot)
  if (!existsSync(absRoot)) return out

  for (const entry of readdirSync(absRoot, { withFileTypes: true })) {
    const relativePath = path.posix.join(relativeRoot.replace(/\\/g, '/'), entry.name)
    if (!normalizeRepositoryInput(repoRoot, relativePath)) continue

    const abs = path.join(repoRoot, relativePath)
    // Prefer real stat so symlinks/junctions to dirs never enter the file list
    // (readFileSync on a directory throws EISDIR and breaks Vercel generate).
    let stats
    try {
      stats = statSync(abs)
    } catch {
      continue
    }
    if (stats.isDirectory()) {
      walkFiles(repoRoot, relativePath, predicate, out)
    } else if (stats.isFile() && predicate(relativePath, abs)) {
      out.push(relativePath.replace(/\\/g, '/'))
    }
  }

  return out
}

function isSourceFile(relativePath) {
  return SOURCE_EXTENSIONS.has(path.extname(relativePath))
}

function isTestFile(relativePath) {
  return /\.(test|spec)\.[cm]?[jt]sx?$/.test(relativePath)
}

function isWorkflowFile(relativePath) {
  return relativePath.startsWith('.github/workflows/') && relativePath.endsWith('.yml')
}

function addNode(nodes, nodeIds, node) {
  if (nodeIds.has(node.id)) return
  nodeIds.add(node.id)
  nodes.push(node)
}

function addEdge(edges, edgeIds, edge) {
  if (edgeIds.has(edge.id)) return
  edgeIds.add(edge.id)
  edges.push(edge)
}

function graphInputFingerprint(repoRoot, relativePaths) {
  const hash = createHash('sha256')
  for (const relativePath of relativePaths) {
    const stats = statSync(path.join(repoRoot, relativePath))
    hash.update(relativePath)
    hash.update('\0')
    hash.update(String(stats.size))
    hash.update('\0')
    hash.update(String(stats.mtimeMs))
    hash.update('\n')
  }
  return hash.digest('hex')
}

function sourceLineForOffset(sourceText, offset) {
  let line = 1
  for (let index = 0; index < offset; index += 1) {
    if (sourceText.charCodeAt(index) === 10) line += 1
  }
  return line
}

function extractImportSpecifiers(sourceText) {
  const records = []
  const seen = new Set()
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(sourceText)) !== null) {
      const specifier = match[1]
      if (!specifier) continue
      const key = `${match.index}:${specifier}`
      if (seen.has(key)) continue
      seen.add(key)
      records.push({ fileName: specifier, pos: match.index })
    }
  }

  return records.sort((left, right) => left.pos - right.pos)
}

function resolveRepositoryImport({ sourcePath, specifier, sourceFileSet }) {
  let basePath
  if (specifier.startsWith('@/')) {
    basePath = `site/${specifier.slice(2)}`
  } else if (specifier.startsWith('.')) {
    basePath = path.posix.normalize(
      path.posix.join(path.posix.dirname(sourcePath), specifier),
    )
  } else {
    return null
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}/index.ts`,
    `${basePath}/index.tsx`,
    `${basePath}/index.js`,
    `${basePath}/index.jsx`,
    `${basePath}/index.mjs`,
    `${basePath}/index.cjs`,
  ]
  return candidates.find((candidate) => sourceFileSet.has(candidate)) ?? null
}

export function extractRepoGraph({ repoRoot = defaultRepoRoot } = {}) {
  const sourceFiles = SCAN_ROOTS.flatMap((root) => walkFiles(repoRoot, root, isSourceFile))
  const testFiles = sourceFiles.filter(isTestFile)
  const workflowFiles = walkFiles(repoRoot, '.github/workflows', (relativePath) => isWorkflowFile(relativePath))
  const packageFiles = [
    'package.json',
    'tech-docs-generator/package.json',
  ].filter((relativePath) => existsSync(path.join(repoRoot, relativePath)))
  const fingerprint = graphInputFingerprint(
    repoRoot,
    [...sourceFiles, ...workflowFiles, ...packageFiles].sort(comparePaths),
  )
  const cached = graphCache.get(repoRoot)
  if (cached?.fingerprint === fingerprint) return cached.graph

  const nodes = []
  const edges = []
  const nodeIds = new Set()
  const edgeIds = new Set()
  const sourceHashes = new Map()
  const hash = (relativePath) => {
    const cached = sourceHashes.get(relativePath)
    if (cached) return cached
    const value = sourceHash(repoRoot, relativePath)
    sourceHashes.set(relativePath, value)
    return value
  }

  for (const route of extractRouteRecords({ repoRoot })) {
    addNode(nodes, nodeIds, {
      id: `route:${route.path}`,
      kind: 'route',
      label: route.path,
      sourcePath: route.sourcePath,
      sourcePointer: route.sourcePointer ?? `route ${route.path}`,
      sourceHash: hash(route.sourcePath),
    })
    addNode(nodes, nodeIds, {
      id: `file:${route.sourcePath}`,
      kind: 'file',
      label: path.basename(route.sourcePath),
      sourcePath: route.sourcePath,
      sourcePointer: route.sourcePath,
      sourceHash: hash(route.sourcePath),
    })
    addEdge(edges, edgeIds, {
      id: `owns:route:${route.path}->file:${route.sourcePath}`,
      kind: 'owns',
      from: `route:${route.path}`,
      to: `file:${route.sourcePath}`,
      sourcePath: route.sourcePath,
      sourcePointer: route.sourcePointer ?? `route ${route.path}`,
      sourceHash: hash(route.sourcePath),
    })
  }

  for (const apiRecord of extractApiRecords({ repoRoot })) {
    const apiId = `api:${apiRecord.path}:${apiRecord.method}`
    addNode(nodes, nodeIds, {
      id: apiId,
      kind: 'api',
      label: `${apiRecord.method} ${apiRecord.path}`,
      sourcePath: apiRecord.sourcePath,
      sourcePointer: apiRecord.sourcePointer,
      sourceHash: hash(apiRecord.sourcePath),
    })
    addNode(nodes, nodeIds, {
      id: `file:${apiRecord.sourcePath}`,
      kind: 'file',
      label: path.basename(apiRecord.sourcePath),
      sourcePath: apiRecord.sourcePath,
      sourcePointer: apiRecord.sourcePath,
      sourceHash: hash(apiRecord.sourcePath),
    })
    addEdge(edges, edgeIds, {
      id: `owns:${apiId}->file:${apiRecord.sourcePath}`,
      kind: 'owns',
      from: apiId,
      to: `file:${apiRecord.sourcePath}`,
      sourcePath: apiRecord.sourcePath,
      sourcePointer: apiRecord.sourcePointer,
      sourceHash: hash(apiRecord.sourcePath),
    })
  }

  for (const relativePath of packageFiles) {
    addNode(nodes, nodeIds, {
      id: `package:${relativePath}`,
      kind: 'package',
      label: relativePath,
      sourcePath: relativePath,
      sourcePointer: relativePath,
      sourceHash: hash(relativePath),
    })
  }

  for (const relativePath of workflowFiles) {
    addNode(nodes, nodeIds, {
      id: `workflow:${relativePath}`,
      kind: 'workflow',
      label: path.basename(relativePath),
      sourcePath: relativePath,
      sourcePointer: relativePath,
      sourceHash: hash(relativePath),
    })
  }

  for (const relativePath of testFiles) {
    addNode(nodes, nodeIds, {
      id: `test:${relativePath}`,
      kind: 'test',
      label: path.basename(relativePath),
      sourcePath: relativePath,
      sourcePointer: relativePath,
      sourceHash: hash(relativePath),
    })
  }

  const sourceFileSet = new Set(sourceFiles)

  for (const relativePath of sourceFiles) {
    const absPath = path.join(repoRoot, relativePath)
    let sourceText
    try {
      const stats = statSync(absPath)
      if (!stats.isFile()) continue
      sourceText = readFileSync(absPath, 'utf8')
    } catch {
      // Skip unreadable / non-file paths (e.g. EISDIR on odd mounts).
      continue
    }

    addNode(nodes, nodeIds, {
      id: `file:${relativePath}`,
      kind: 'file',
      label: path.basename(relativePath),
      sourcePath: relativePath,
      sourcePointer: relativePath,
      sourceHash: hash(relativePath),
    })

    const imports = extractImportSpecifiers(sourceText)
    for (const importedFile of imports) {
      const specifier = importedFile.fileName
      const targetRelative = resolveRepositoryImport({
        sourcePath: relativePath,
        specifier,
        sourceFileSet,
      })
      if (!targetRelative) continue
      const sourceLine = sourceLineForOffset(sourceText, importedFile.pos)

      addNode(nodes, nodeIds, {
        id: `file:${targetRelative}`,
        kind: 'file',
        label: path.basename(targetRelative),
        sourcePath: targetRelative,
        sourcePointer: targetRelative,
        sourceHash: hash(targetRelative),
      })

      addEdge(edges, edgeIds, {
        id: `imports:file:${relativePath}->file:${targetRelative}:${specifier}`,
        kind: 'imports',
        from: `file:${relativePath}`,
        to: `file:${targetRelative}`,
        sourcePath: relativePath,
        sourcePointer: specifier,
        sourceHash: hash(relativePath),
        sourceLine,
      })

      if (isTestFile(relativePath) && !isTestFile(targetRelative)) {
        addEdge(edges, edgeIds, {
          id: `tests:test:${relativePath}->file:${targetRelative}`,
          kind: 'tests',
          from: `test:${relativePath}`,
          to: `file:${targetRelative}`,
          sourcePath: relativePath,
          sourcePointer: specifier,
          sourceHash: hash(relativePath),
          sourceLine,
        })
      }
    }
  }

  nodes.sort((left, right) => comparePaths(left.id, right.id))
  edges.sort((left, right) => comparePaths(left.id, right.id))

  const graph = { nodes, edges }
  graphCache.set(repoRoot, { fingerprint, graph })
  return graph
}
