import databaseJson from '../../../generated-documents/data/database.json'
import commandsJson from '../../../generated-documents/data/commands.json'

export type DatabaseTable = {
  name: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
}

export type DatabaseMigration = {
  path: string
  sourcePath: string
  sourceKind: string
  sourcePointer: string
}

type CommandRecord = {
  packageName: string
  scriptName: string
  command: string
  sourcePath: string
  sourcePointer: string
}

type DatabasePayload = {
  schema: { tables: DatabaseTable[] }
  migrations: DatabaseMigration[]
}

const database = databaseJson as DatabasePayload
const commands = commandsJson as CommandRecord[]

export const databaseTables = database.schema.tables
export const databaseMigrations = database.migrations

const isDatabaseOpsCommand = (record: CommandRecord) =>
  record.sourcePath === 'scripts/run-ops.mjs' && /^(db:|seed)/.test(record.scriptName)

export const databaseCommands = commands
  .filter(
    (record) =>
      (record.sourcePath === 'package.json' && /^(db:|seed$)/.test(record.scriptName)) ||
      isDatabaseOpsCommand(record),
  )
  .sort((left, right) => left.scriptName.localeCompare(right.scriptName))
