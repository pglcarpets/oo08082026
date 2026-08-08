import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project, SyntaxKind } from 'ts-morph'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')

function loadAllowlist() {
  const raw = readFileSync(path.join(scriptDir, 'uiOnly-allowlist.json'), 'utf8')
  const parsed = JSON.parse(raw)
  return new Set(parsed.files.map((entry) => entry.path.replace(/\\/g, '/')))
}

function relativeFromRoot(absPath, root) {
  return path.relative(root, absPath).replace(/\\/g, '/')
}

function walkFiles(dir, pattern, out = []) {
  if (!existsSync(dir)) return out

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walkFiles(abs, pattern, out)
      continue
    }
    if (pattern.test(entry.name)) out.push(abs)
  }
  return out
}

function scanModuleLevelFacts(sourceFile, relPath) {
  const violations = []

  for (const statement of sourceFile.getStatements()) {
    if (!statement.isKind(SyntaxKind.VariableStatement)) continue

    for (const declaration of statement.getDeclarations()) {
      const initializer = declaration.getInitializer()
      if (!initializer) continue

      if (initializer.isKind(SyntaxKind.ArrayLiteralExpression) && initializer.getElements().length > 0) {
        violations.push({
          file: relPath,
          line: declaration.getStartLineNumber(),
          reason: `module-level array literal with ${initializer.getElements().length} element(s)`,
        })
      }

      if (initializer.isKind(SyntaxKind.ObjectLiteralExpression)) {
        const props = initializer.getProperties()
        if (props.length > 2) {
          violations.push({
            file: relPath,
            line: declaration.getStartLineNumber(),
            reason: `module-level object literal with ${props.length} properties`,
          })
        }
      }

      if (initializer.isKind(SyntaxKind.NoSubstitutionTemplateLiteral) || initializer.isKind(SyntaxKind.StringLiteral)) {
        const text = initializer.getLiteralText()
        if (text.length > 120) {
          violations.push({
            file: relPath,
            line: declaration.getStartLineNumber(),
            reason: `module-level string literal with ${text.length} characters`,
          })
        }
      }
    }
  }

  return violations
}

function scanDataLoaderImports(sourceFile, relPath) {
  const violations = []
  for (const importDecl of sourceFile.getImportDeclarations()) {
    const modSpec = importDecl.getModuleSpecifierValue()
    if (modSpec.startsWith('react') || modSpec.includes('components')) {
      violations.push({
        file: relPath,
        line: importDecl.getStartLineNumber(),
        reason: `Data loader should not import UI or components: ${modSpec}`
      })
    }
  }
  return violations
}

export function checkHardcoding(optionsOrRoot = packageRoot) {
  const root = typeof optionsOrRoot === 'string' ? optionsOrRoot : (optionsOrRoot.root || packageRoot)
  const project = new Project()
  const allowlist = loadAllowlist()

  const targets = [
    ...walkFiles(path.join(root, 'src/pages'), /\.tsx$/).filter(
      (absPath) => path.resolve(path.dirname(absPath)) === path.resolve(root, 'src/pages'),
    ),
    ...walkFiles(path.join(root, 'src/app'), /\.tsx$/),
    ...walkFiles(path.join(root, 'src/data'), /\.ts$/),
  ]

  for (const absPath of targets) {
    project.addSourceFileAtPath(absPath)
  }

  const violations = []

  for (const sourceFile of project.getSourceFiles()) {
    const relPath = relativeFromRoot(sourceFile.getFilePath(), root)
    if (allowlist.has(relPath)) continue

    if (relPath.startsWith('src/pages/') || relPath.startsWith('src/app/')) {
      violations.push(...scanModuleLevelFacts(sourceFile, relPath))
      continue
    }

    if (relPath.startsWith('src/data/') && relPath !== 'src/data/routeDomainTypes.ts') {
      violations.push(...scanDataLoaderImports(sourceFile, relPath))
      violations.push(...scanModuleLevelFacts(sourceFile, relPath))
    }
  }

  return violations
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  const violations = checkHardcoding()
  if (violations.length > 0) {
    console.error(`Hardcoding guard failed (${violations.length}):`)
    for (const item of violations) {
      console.error(`- ${item.file}:${item.line} ${item.reason}`)
    }
    process.exitCode = 1
  } else {
    console.log('Hardcoding guard passed')
  }
}
