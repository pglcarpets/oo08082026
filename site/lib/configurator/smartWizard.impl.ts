import { getDefaults } from "./smartWizardConstants";
import {
  getElementLibraryCatalog,
  getElementLibraryDescriptions,
  type LibraryItem,
} from "./smartWizardCatalog";

export const SMART_WIZARD_ROOM_TYPES = [
  'open-plan',
  'executive',
  'studio',
  'coworking',
  'blank',
] as const

export const SMART_WIZARD_STYLE_PRESETS = [
  'Modern',
  'Warm',
  'Minimalist',
  'Executive',
  'Industrial',
] as const

export type SmartWizardRoomType = (typeof SMART_WIZARD_ROOM_TYPES)[number]
export type SmartWizardStylePreset = (typeof SMART_WIZARD_STYLE_PRESETS)[number]

export interface SmartWizardRequest {
  templateId: string
  roomType: SmartWizardRoomType
  roomWidthMm: number
  roomLengthMm: number
  style: string
}

export interface SmartWizardPlacement {
  productId: string
  x: number
  y: number
  rotation: number
}

export interface SmartWizardPlan {
  summary: string
  warnings: string[]
  placements: SmartWizardPlacement[]
}

export interface SmartWizardResponse extends SmartWizardPlan {
  palette: string[]
}

export interface SmartWizardBounds {
  width: number
  height: number
}

const MM_TO_CANVAS_UNITS = 10

export function roomMmToCanvasUnits(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {return 0}
  return Math.max(0, Math.round(value / MM_TO_CANVAS_UNITS))
}

export function normalizeWizardProductId(value: string): string {
  return value.trim().toLowerCase()
}

export function getWizardCatalog() {
  return getElementLibraryCatalog()
}

export function findWizardCatalogItem(
  productId: string,
  catalog: LibraryItem[] = getWizardCatalog(),
): LibraryItem | null {
  const normalized = normalizeWizardProductId(productId)
  return (
    catalog.find((item) => normalizeWizardProductId(wizardProductKey(item)) === normalized) ??
    null
  )
}

export function wizardProductKey(item: LibraryItem): string {
  return item.shape ? `${item.type}/${item.shape}` : item.type
}

function stripJsonCodeFence(value: string): string {
  return value.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim()
}

export function parseWizardPlan(raw: string): SmartWizardPlan | null {
  if (!raw.trim()) {return null}
  try {
    const parsed = JSON.parse(stripJsonCodeFence(raw)) as Record<string, unknown>
    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : []
    const placements = Array.isArray(parsed.placements)
      ? parsed.placements
          .map((entry) => normalizePlacement(entry))
          .filter((entry): entry is SmartWizardPlacement => Boolean(entry))
      : []

    if (!summary || placements.length === 0) {return null}
    return { summary, warnings, placements }
  } catch {
    return null
  }
}

function normalizePlacement(value: unknown): SmartWizardPlacement | null {
  if (!value || typeof value !== 'object') {return null}
  const source = value as Record<string, unknown>
  const productId =
    typeof source.productId === 'string' && source.productId.trim().length > 0
      ? source.productId.trim()
      : ''
  if (!productId) {return null}
  const x = typeof source.x === 'number' && Number.isFinite(source.x) ? source.x : null
  const y = typeof source.y === 'number' && Number.isFinite(source.y) ? source.y : null
  const rotation =
    typeof source.rotation === 'number' && Number.isFinite(source.rotation)
      ? source.rotation
      : 0
  if (x === null || y === null) {return null}
  return {
    productId,
    x,
    y,
    rotation,
  }
}

export function clampPlacementToBounds(
  placement: SmartWizardPlacement,
  item: LibraryItem,
  bounds: SmartWizardBounds,
): SmartWizardPlacement {
  const defaults = getDefaults(item.type, item.shape)
  const halfWidth = Math.max(1, Math.round((defaults?.width ?? 60) / 2))
  const halfHeight = Math.max(1, Math.round((defaults?.height ?? 60) / 2))
  const minX = halfWidth
  const minY = halfHeight
  const maxX = Math.max(minX, bounds.width - halfWidth)
  const maxY = Math.max(minY, bounds.height - halfHeight)

  const x = Math.min(maxX, Math.max(minX, Math.round(placement.x)))
  const y = Math.min(maxY, Math.max(minY, Math.round(placement.y)))
  const rotation = Number.isFinite(placement.rotation) ? Math.round(placement.rotation) : 0

  return {
    productId: wizardProductKey(item),
    x,
    y,
    rotation,
  }
}

export function computeWizardPalette(
  placements: SmartWizardPlacement[],
  catalog: LibraryItem[] = getWizardCatalog(),
): string[] {
  const palette: string[] = []
  const seen = new Set<string>()
  for (const placement of placements) {
    const item = findWizardCatalogItem(placement.productId, catalog)
    if (!item) {continue}
    const defaults = getDefaults(item.type, item.shape)
    for (const color of [defaults?.fill, defaults?.stroke]) {
      if (!color || seen.has(color)) {continue}
      seen.add(color)
      palette.push(color)
    }
    if (palette.length >= 5) {break}
  }
  return palette
}

export function buildFallbackWizardPlan(
  request: SmartWizardRequest,
  catalog: LibraryItem[] = getWizardCatalog(),
): SmartWizardPlan {
  const bounds = {
    width: roomMmToCanvasUnits(request.roomWidthMm),
    height: roomMmToCanvasUnits(request.roomLengthMm),
  }
  const presets: Record<SmartWizardRoomType, string[]> = {
    'open-plan': ['workstation', 'workstation', 'conference-room', 'phone-booth', 'plant'],
    executive: ['private-office', 'conference-room', 'sofa', 'whiteboard', 'plant'],
    studio: ['desk', 'desk/l-shape', 'workstation', 'common-area', 'plant'],
    coworking: ['hot-desk', 'workstation', 'conference-room', 'phone-booth', 'coffee-table'],
    blank: ['workstation', 'conference-room', 'plant'],
  }

  const wanted = presets[request.roomType] ?? presets.blank
  const items = wanted
    .map((productId) => findWizardCatalogItem(productId, catalog))
    .filter((item): item is LibraryItem => Boolean(item))

  const placements = items.map((item, index) => {
    const columns = Math.max(1, Math.min(3, items.length))
    const row = Math.floor(index / columns)
    const col = index % columns
    const spacingX = bounds.width / (columns + 1)
    const spacingY = bounds.height / (Math.ceil(items.length / columns) + 1)
    const basePlacement: SmartWizardPlacement = {
      productId: wizardProductKey(item),
      x: spacingX * (col + 1),
      y: spacingY * (row + 1),
      rotation: index % 2 === 0 ? 0 : 90,
    }
    return clampPlacementToBounds(basePlacement, item, bounds)
  })

  return {
    summary:
      request.roomType === 'blank'
        ? 'A balanced starter layout for a blank room.'
        : `Fallback ${request.roomType} layout prepared from the catalog when AI is unavailable.`,
    warnings: ['AI provider unavailable, so this is a deterministic fallback layout.'],
    placements,
  }
}

export function buildWizardSystemPrompt(request: SmartWizardRequest, catalog: LibraryItem[]): string {
  const roomWidthUnits = roomMmToCanvasUnits(request.roomWidthMm)
  const roomLengthUnits = roomMmToCanvasUnits(request.roomLengthMm)
  const descriptions = getElementLibraryDescriptions()

  const catalogLines = catalog
    .map((item) => {
      const key = wizardProductKey(item)
      const description = descriptions[key] ?? `${item.category} element`
      const defaults = getDefaults(item.type, item.shape)
      return `- ${key} | ${item.label} | ${item.category} | ${description} | default ${defaults?.width ?? 60}x${defaults?.height ?? 60}`
    })
    .join('\n')

  return [
    'You are the Oando Smart Wizard for an office interior editor.',
    'Return only valid JSON. No markdown, no prose outside JSON.',
    'Choose only productId values from the catalog list below.',
    'Workstation clusters must be treated as single placeable units.',
    'Keep every placement inside the room bounds.',
    'Return placements using canvas units, not millimeters.',
    `Room bounds: width=${roomWidthUnits}, height=${roomLengthUnits}`,
    `Template id: ${request.templateId}`,
    `Room type: ${request.roomType}`,
    `Style: ${request.style}`,
    '',
    'Required JSON shape:',
    '{',
    '  "summary": "short summary",',
    '  "warnings": ["optional warning"],',
    '  "placements": [',
    '    { "productId": "desk", "x": 120, "y": 90, "rotation": 0 }',
    '  ]',
    '}',
    '',
    'Catalog:',
    catalogLines,
  ].join('\n')
}

