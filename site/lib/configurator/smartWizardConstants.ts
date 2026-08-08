export const GRID_SIZE_DEFAULT = 12
export const GRID_SNAP_THRESHOLD = 6
export const WALL_SNAP_THRESHOLD = 8
export const SEAT_DROP_THRESHOLD = 20

export const ZOOM_MIN = 0.1
export const ZOOM_MAX = 4.0
/** Additive step — kept for any legacy callers. Prefer ZOOM_FACTOR. */
export const ZOOM_STEP = 0.1
/**
 * Multiplicative step for toolbar zoom buttons / Cmd+= / Cmd+-. Using a
 * factor keeps the perceived step uniform across the zoom range (a +0.1
 * additive step is 100% at 10% zoom but only 2.5% at 400% zoom). 1.2 is
 * the sweet spot where each click is visibly different without overshooting.
 */
export const ZOOM_FACTOR = 1.2
/**
 * Exponential sensitivity for the wheel / trackpad zoom handler. Applied
 * as `Math.exp(-deltaY * ZOOM_WHEEL_SENSITIVITY)`, which normalises the
 * step by event magnitude — one big mouse-wheel tick (deltaY ≈ 100) and
 * a stream of tiny trackpad deltas (~2–4 each) now feel comparable
 * instead of one being jerky and the other laggy.
 */
export const ZOOM_WHEEL_SENSITIVITY = 0.0015

export const UNDO_LIMIT = 50

export const ALIGNMENT_THRESHOLD = 5

export const GROUP_COLORS = [
  'var(--color-primary)', // blue
  'var(--color-danger)', // red
  'var(--border-soft)', // emerald
  'var(--color-warning)', // amber
  'var(--border-soft)', // violet
  'var(--border-soft)', // pink
  'var(--border-soft)', // cyan
  'var(--border-soft)', // orange
  'var(--border-soft)', // lime
  'var(--color-primary)', // indigo
  'var(--border-soft)', // teal
  'var(--border-soft)', // fuchsia
] as const



export const CURSOR_COLORS = [
  'var(--color-primary)', 'var(--color-danger)', 'var(--border-soft)', 'var(--color-warning)',
  'var(--border-soft)', 'var(--border-soft)', 'var(--border-soft)', 'var(--border-soft)',
] as const

export const UNASSIGNED_SEAT_FILL = 'var(--surface-panel)'
export const UNASSIGNED_SEAT_STROKE = 'var(--border-soft)'
export const CONFLICT_COLOR = 'var(--color-danger)'
export const ALIGNMENT_GUIDE_COLOR = 'var(--border-soft)'

export const ELEMENT_DEFAULTS: Record<string, { width: number; height: number; fill: string; stroke: string }> = {
  'table-rect': { width: 120, height: 60, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'table-conference': { width: 240, height: 80, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'chair': { width: 24, height: 24, fill: 'var(--surface-panel)', stroke: 'var(--color-primary)' },
  'desk': { width: 72, height: 48, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'counter': { width: 120, height: 36, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'custom-shape': { width: 100, height: 100, fill: 'var(--surface-panel)', stroke: 'var(--surface-panel)' },
  'divider': { width: 120, height: 4, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'planter': { width: 40, height: 40, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'hot-desk': { width: 72, height: 48, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'workstation': { width: 200, height: 60, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'private-office': { width: 120, height: 100, fill: 'var(--surface-panel)', stroke: 'var(--color-primary)' },
  'conference-room': { width: 200, height: 140, fill: 'var(--border-soft)', stroke: 'var(--color-warning)' },
  'phone-booth': { width: 60, height: 60, fill: 'var(--surface-panel)', stroke: 'var(--color-success)' },
  'common-area': { width: 160, height: 120, fill: 'var(--surface-panel)', stroke: 'var(--color-success)' },
  'decor': { width: 60, height: 60, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  // Furniture catalog — see `src/types/elements.ts`. Sizes are load-bearing:
  // they're asserted in `furnitureCatalog.test.ts` and drive the default
  // drop size from the library.
  'sofa':            { width: 200, height: 80,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'plant':           { width: 40,  height: 40,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'printer':         { width: 60,  height: 50,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'whiteboard':      { width: 180, height: 20,  fill: 'var(--surface-panel)', stroke: 'var(--text-body)' },
  'lounge-chair':    { width: 80,  height: 80,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'coffee-table':    { width: 100, height: 60,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'file-cabinet':    { width: 40,  height: 50,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'storage-cabinet': { width: 90,  height: 50,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'locker':          { width: 40,  height: 40,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'vending-machine': { width: 90,  height: 80,  fill: 'var(--border-soft)', stroke: 'var(--text-body)' },
  'water-cooler':    { width: 40,  height: 40,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'acoustic-pod':    { width: 120, height: 120, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'credenza':        { width: 160, height: 50,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'coat-rack':       { width: 40,  height: 40,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  // IT/AV/Network/Power layer (M1) — see `src/types/elements.ts`.
  // Defaults are LOAD-BEARING: the per-type renderers consume them via
  // `element.style.fill` / `style.stroke`, and the M2 library tiles
  // will spawn elements at exactly these dimensions. Sizes were chosen
  // to keep each silhouette readable at typical office-floor zoom
  // (~0.5×–1×) without overwhelming the seating layer underneath.
  'access-point':  { width: 30, height: 30, fill: 'var(--surface-panel)', stroke: 'var(--color-primary)' },
  'network-jack':  { width: 18, height: 18, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'display':       { width: 80, height: 16, fill: 'var(--border-soft)', stroke: 'var(--text-body)' },
  'video-bar':     { width: 90, height: 18, fill: 'var(--border-soft)', stroke: 'var(--text-body)' },
  'badge-reader':  { width: 18, height: 24, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'outlet':        { width: 16, height: 24, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
}

export const TABLE_SEAT_DEFAULTS: Record<string, number> = {
  'table-rect': 6,
  'table-conference': 14,
  'table-round': 4,
  'table-oval': 6,
}

/**
 * Per-shape defaults. Falls back to ELEMENT_DEFAULTS[type] when a shape
 * variant is not listed here. Keys are "<type>/<shape>" strings.
 */
export const SHAPE_DEFAULTS: Record<string, { width: number; height: number; fill: string; stroke: string }> = {
  // Desk variants
  'desk/l-shape':       { width: 120, height: 100, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'desk/cubicle':       { width: 120, height: 120, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'hot-desk/l-shape':   { width: 120, height: 100, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'hot-desk/cubicle':   { width: 120, height: 120, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },

  // Private office variants
  'private-office/u-shape': { width: 200, height: 160, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },

  // Table variants
  'table-round':        { width: 100, height: 100, fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'table-oval':         { width: 140, height: 90,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },

  // Decor
  'decor/armchair':         { width: 60,  height: 60,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'decor/couch':            { width: 150, height: 60,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'decor/reception':        { width: 180, height: 90,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'decor/kitchen-counter':  { width: 200, height: 60,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'decor/fridge':           { width: 70,  height: 70,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'decor/whiteboard':       { width: 140, height: 20,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'decor/column':           { width: 40,  height: 40,  fill: 'var(--border-soft)', stroke: 'var(--border-soft)' },
  'decor/stairs':           { width: 120, height: 80,  fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
  'decor/elevator':         { width: 100, height: 100, fill: 'var(--surface-panel)', stroke: 'var(--border-soft)' },
}

/** Resolve the effective default for a type + optional shape. */
export function getDefaults(type: string, shape?: string) {
  if (shape) {
    const key = `${type}/${shape}`
    if (SHAPE_DEFAULTS[key]) {return SHAPE_DEFAULTS[key]}
  }
  // 'table-round'/'table-oval' are top-level types with no shape subdiscriminator
  if (SHAPE_DEFAULTS[type]) {return SHAPE_DEFAULTS[type]}
  return ELEMENT_DEFAULTS[type]
}



