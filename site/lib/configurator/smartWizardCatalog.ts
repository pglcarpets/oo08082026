/**
 * Configurator element library catalog.
 *
 * Catalog for the workspace/occupancy planner's element library — the tiles
 * shown in the editor's left-sidebar Library (see
 * `components/editor/LeftSidebar/ElementLibrary.tsx`).
 *
 * Previously this list (and its tile descriptions) were `const`s inlined in the
 * component. They now live here as DATA: typed, independently testable, and
 * overridable per tenant. The view reads everything through
 * `getElementLibraryCatalog()` / `getElementLibraryDescriptions()`.
 *
 * IMPORTANT — closed type set. Every `type` below must be a member of the
 * `ElementType` discriminated union (`types/elements.ts`). The canvas
 * renderers, `lib/constants#getDefaults`, and the seat-layout logic switch on
 * these known types, so this catalog *selects, labels, and orders* existing
 * element kinds — it does not introduce new ones. This is also why the catalog
 * is NOT driven directly off `features/shared/catalog` `SharedProduct` rows:
 * those describe sellable furniture SKUs (id/sku/price/finishes) and carry no
 * `ElementType`/`shape`, so they cannot map onto floor-plan symbols without a
 * separate, deliberate mapping layer.
 *
 * Tenant override seam: `getElementLibraryCatalog()` returns the default
 * catalog today. When per-tenant catalog config lands (plan 06 / Supabase),
 * change only this function's body to merge tenant data over
 * `DEFAULT_ELEMENT_LIBRARY` — every consumer already reads through it.
 */
export interface LibraryItem {
  type: string
  label: string
  category: string
  /** Optional shape override (e.g. desk `l-shape`, decor `column`). */
  shape?: string
  /** Only present when type === 'custom-svg'. Inline sanitised SVG source. */
  svgSource?: string
  /** Only present when type === 'custom-svg'. Stable id of the custom shape so
   *  the library tile and the stored shape stay linked (used by the "×" delete
   *  button on the tile). */
  customShapeId?: string
}

/**
 * Default element-library catalog. Order here drives section order in the
 * sidebar (sections are the distinct `category` values, first-seen order).
 */
export const DEFAULT_ELEMENT_LIBRARY: LibraryItem[] = [
  // Tables
  { type: 'table-rect',        label: 'Rect Table',     category: 'Tables' },
  { type: 'table-conference',  label: 'Conf. Table',    category: 'Tables' },
  { type: 'table-round',       label: 'Round Table',    category: 'Tables' },
  { type: 'table-oval',        label: 'Oval Table',     category: 'Tables' },

  // Desks
  { type: 'desk',              label: 'Desk',           category: 'Desks' },
  { type: 'hot-desk',          label: 'Hot Desk',       category: 'Desks' },
  { type: 'desk',              label: 'L-Shape Desk',   category: 'Desks', shape: 'l-shape' },
  { type: 'desk',              label: 'Cubicle',        category: 'Desks', shape: 'cubicle' },
  { type: 'workstation',       label: 'Workstation',    category: 'Desks' },
  { type: 'private-office',    label: 'Private Office', category: 'Desks' },
  { type: 'private-office',    label: 'U-Shape Office', category: 'Desks', shape: 'u-shape' },

  // Rooms
  { type: 'conference-room',   label: 'Conference Room', category: 'Rooms' },
  { type: 'phone-booth',       label: 'Phone Booth',     category: 'Rooms' },
  { type: 'common-area',       label: 'Common Area',     category: 'Rooms' },

  // Seating
  { type: 'chair',             label: 'Office Chair',    category: 'Seating' },
  { type: 'decor',             label: 'Armchair',        category: 'Seating', shape: 'armchair' },
  { type: 'decor',             label: 'Couch',           category: 'Seating', shape: 'couch' },

  // Structure
  { type: 'decor',             label: 'Column',          category: 'Structure', shape: 'column' },
  { type: 'decor',             label: 'Stairs',          category: 'Structure', shape: 'stairs' },
  { type: 'decor',             label: 'Elevator',        category: 'Structure', shape: 'elevator' },
  { type: 'divider',           label: 'Divider',         category: 'Structure' },
  { type: 'planter',           label: 'Planter',         category: 'Structure' },

  // Facilities
  { type: 'decor',             label: 'Reception Desk',  category: 'Facilities', shape: 'reception' },
  { type: 'decor',             label: 'Kitchen Counter', category: 'Facilities', shape: 'kitchen-counter' },
  { type: 'decor',             label: 'Fridge',          category: 'Facilities', shape: 'fridge' },
  { type: 'decor',             label: 'Whiteboard',      category: 'Facilities', shape: 'whiteboard' },
  { type: 'counter',           label: 'Counter',         category: 'Facilities' },

  // Furniture — decorative/context props (non-assignable). See
  // `types/elements.ts` for the discriminated-union members.
  { type: 'sofa',              label: 'Sofa',            category: 'Furniture' },
  { type: 'plant',             label: 'Plant',           category: 'Furniture' },
  { type: 'printer',           label: 'Printer',         category: 'Furniture' },
  { type: 'whiteboard',        label: 'Whiteboard',      category: 'Furniture' },

  // Other
  { type: 'custom-shape',      label: 'Custom Shape',    category: 'Other' },
  { type: 'text-label',        label: 'Text Label',      category: 'Other' },
]

/**
 * Tile descriptions keyed by `type[/shape]` — shown in the library hover
 * tooltip. Catalog metadata, kept next to the catalog so a single edit updates
 * both the tile and its tooltip. Missing entries fall back to a generic
 * single-line tooltip in the renderer.
 */
export const ELEMENT_LIBRARY_DESCRIPTIONS: Record<string, string> = {
  'table-rect': 'Rectangular meeting or work table.',
  'table-conference': 'Long conference table with seats around the edges.',
  'table-round': 'Round table — sociable, equal-distance seating.',
  'table-oval': 'Oval table — large boardroom-style meetings.',
  desk: 'Single-person desk.',
  'hot-desk': 'Flexible-use desk — no fixed occupant.',
  'desk/l-shape': 'L-shaped desk — extra surface area for monitors.',
  'desk/cubicle': 'Enclosed cubicle desk for focus work.',
  workstation: 'Multi-person bench, up to four seats.',
  'private-office': 'Walled office with one occupant.',
  'private-office/u-shape': 'U-shaped private office for two people.',
  'conference-room': 'Bookable meeting room with capacity.',
  'phone-booth': 'Single-occupant phone or focus pod.',
  'common-area': 'Shared lounge or breakout zone.',
  chair: 'Standalone office chair.',
  'decor/armchair': 'Lounge armchair for casual seating.',
  'decor/couch': 'Sofa for breakout / casual areas.',
  'decor/column': 'Structural column — block off as obstruction.',
  'decor/stairs': 'Stairs / stairwell footprint.',
  'decor/elevator': 'Elevator shaft footprint.',
  divider: 'Partition wall between zones.',
  planter: 'Decorative planter or large indoor plant.',
  'decor/reception': 'Reception desk near building entrance.',
  'decor/kitchen-counter': 'Kitchen counter / kitchenette block.',
  'decor/fridge': 'Fridge — pantry or break room.',
  'decor/whiteboard': 'Wall-mounted whiteboard.',
  counter: 'Service counter or bar.',
  sofa: 'Three-seat sofa.',
  plant: 'Floor plant — small decorative footprint.',
  printer: 'Shared printer or copier.',
  whiteboard: 'Whiteboard footprint.',
  'custom-shape': 'Generic custom outline — resize freely.',
  'text-label': 'Free-form text label.',
}

/**
 * Returns the element-library catalog for the current context.
 *
 * Single seam for swapping in tenant/shared catalog data later — every view
 * consumer reads through this. Today it returns the default catalog.
 */
export function getElementLibraryCatalog(): LibraryItem[] {
  return DEFAULT_ELEMENT_LIBRARY
}

/** Returns the tile-description map (same override seam as the catalog). */
export function getElementLibraryDescriptions(): Record<string, string> {
  return ELEMENT_LIBRARY_DESCRIPTIONS
}
