import commandsJson from '../../../generated-documents/data/commands.json'
import { navItems } from './navigation'
import { overviewKeyTech, overviewStats } from './overviewSummary'

type CommandRecord = {
  packageName: string
  scriptName: string
  command: string
  sourcePath: string
  sourcePointer: string
}

const quickStartScriptNames = ['dev', 'typecheck', 'lint', 'test', 'build', 'release:gate'] as const

const commands = commandsJson as CommandRecord[]

export const overviewQuickCommands = commands
  .filter(
    (record) =>
      record.sourcePath === 'package.json' &&
      (quickStartScriptNames as readonly string[]).includes(record.scriptName),
  )
  .sort(
    (left, right) =>
      quickStartScriptNames.indexOf(left.scriptName as (typeof quickStartScriptNames)[number]) -
      quickStartScriptNames.indexOf(right.scriptName as (typeof quickStartScriptNames)[number]),
  )

export const overviewDocSections = navItems
  .filter((item) => item.path !== '/')
  .map((item) => ({
    label: item.label,
    path: item.path,
  }))

export { overviewKeyTech, overviewStats }
