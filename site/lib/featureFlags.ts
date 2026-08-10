/**
 * App-wide feature flags (defaults + in-memory overrides).
 *
 * Admin `/api/admin/features` merges Supabase rows on top of these defaults.
 * Public `/api/features` exposes the same resolved map for Planner/Studio UI.
 *
 * Port programme modules (01–03) and admin module gates live here so enable/
 * disable is one admin surface (`/admin/features`).
 */

export const DEFAULT_FLAGS = {
  // ── Planner core ──────────────────────────────────────────────
  planner2D: true,
  catalogSidebar: true,
  layersPanel: true,
  measurementTool: true,
  snapToGrid: true,
  /** Port 01 — advanced snap (walls/corners/midpoints). */
  plannerAdvancedSnap: true,
  snapToWall: true,
  /** Port 01 — validation suite + Review panel. */
  plannerValidationPanel: true,
  /** Port 01 — wall endpoint grips. */
  plannerWallGrips: true,
  /** Port 01 — door/window attach to walls. */
  plannerOpeningPlacement: true,
  /** Port 01 — distance guides while placing. */
  plannerDistanceGuides: true,
  /** Port 01 — multi-select align/distribute. */
  plannerAlignDistribute: true,

  // ── Port 02 commercial ────────────────────────────────────────
  plannerBoqPanel: true,
  boqPricingEnabled: false,
  plannerHandoff: true,
  plannerUnderlay: true,
  plannerExportBoq: true,

  // ── Port 03 / Studio catalog ──────────────────────────────────
  studioExportSvg: true,
  studioExportJson: true,
  studioExportPng: true,
  studioExportJpg: true,
  studioExportDxf: true,
  studioImportFiles: true,
  studioPublishCatalog: true,
  /** @planned Port 03 — draft/live/retired lifecycle. No UI consumer yet; seeded in DB for future admin toggle. */
  studioCatalogLifecycle: false,

  // ── Exports (planner) ─────────────────────────────────────────
  plannerExportPdf: true,
  plannerExportPng: true,
  plannerExportSvg: true,
  plannerExportDxf: false,

  // ── AI ────────────────────────────────────────────────────────
  plannerAiAdvisor: true,
  plannerAiSpaceSuggest: true,
  /** Port 04 — sketch image → wall/room geometry */
  sketchToPlan: true,
  /** @planned Marketing site AI advisor. No UI consumer yet; seeded in DB for future site integration. */
  siteAiAdvisor: false,

  // ── Sync / data ───────────────────────────────────────────────
  plannerCloudSync: true,
  plannerGuestWorkspace: true,
  floorPlanImport: true,

  // ── Admin modules (nav + routes) ──────────────────────────────
  adminPlans: true,
  adminCatalog: true,
  adminConfiguratorCatalog: true,
  adminWorkspaceCatalog: true,
  adminAnalytics: true,
  adminFeatureToggle: true,
  adminPriceBooks: true,
  adminThemes: true,
  adminSettings: true,
  adminCrm: true,
  adminCustomerQueries: true,
  adminDesignKit: true,
  adminInventory: true,
  /** Furniture Studio entry in admin Catalog nav. */
  adminFurnitureStudio: true,
} as const;

export type FeatureFlagName = keyof typeof DEFAULT_FLAGS;

export type FeatureFlags = Record<FeatureFlagName, boolean>;

export type FeatureFlagMeta = {
  name: FeatureFlagName;
  description: string;
  defaultValue: boolean;
  group: string;
};

const FLAG_META: readonly FeatureFlagMeta[] = [
  // Core
  { name: "planner2D", description: "2D floor-plan canvas", defaultValue: DEFAULT_FLAGS.planner2D, group: "Planner core" },
  { name: "catalogSidebar", description: "Furniture catalog rail", defaultValue: DEFAULT_FLAGS.catalogSidebar, group: "Planner core" },
  { name: "layersPanel", description: "Layers dock panel", defaultValue: DEFAULT_FLAGS.layersPanel, group: "Planner core" },
  { name: "measurementTool", description: "Dimension / measure tool", defaultValue: DEFAULT_FLAGS.measurementTool, group: "Planner core" },
  { name: "snapToGrid", description: "Grid snapping", defaultValue: DEFAULT_FLAGS.snapToGrid, group: "Planner core" },

  // Port 01
  { name: "plannerAdvancedSnap", description: "Port 01 — advanced snap (corners, walls, edges)", defaultValue: DEFAULT_FLAGS.plannerAdvancedSnap, group: "Port 01 · Geometry & trust" },
  { name: "snapToWall", description: "Port 01 — snap to wall centreline", defaultValue: DEFAULT_FLAGS.snapToWall, group: "Port 01 · Geometry & trust" },
  { name: "plannerValidationPanel", description: "Port 01 — layout validation on Review", defaultValue: DEFAULT_FLAGS.plannerValidationPanel, group: "Port 01 · Geometry & trust" },
  { name: "plannerWallGrips", description: "Port 01 — wall endpoint grips", defaultValue: DEFAULT_FLAGS.plannerWallGrips, group: "Port 01 · Geometry & trust" },
  { name: "plannerOpeningPlacement", description: "Port 01 — doors/windows attach to walls", defaultValue: DEFAULT_FLAGS.plannerOpeningPlacement, group: "Port 01 · Geometry & trust" },
  { name: "plannerDistanceGuides", description: "Port 01 — distance guides", defaultValue: DEFAULT_FLAGS.plannerDistanceGuides, group: "Port 01 · Geometry & trust" },
  { name: "plannerAlignDistribute", description: "Port 01 — multi-select align/distribute", defaultValue: DEFAULT_FLAGS.plannerAlignDistribute, group: "Port 01 · Geometry & trust" },

  // Port 02
  { name: "plannerBoqPanel", description: "Port 02 — BOQ panel", defaultValue: DEFAULT_FLAGS.plannerBoqPanel, group: "Port 02 · Commercial" },
  { name: "boqPricingEnabled", description: "Port 02 — demo/list unit prices on BOQ", defaultValue: DEFAULT_FLAGS.boqPricingEnabled, group: "Port 02 · Commercial" },
  { name: "plannerExportBoq", description: "Port 02 — BOQ CSV/JSON export", defaultValue: DEFAULT_FLAGS.plannerExportBoq, group: "Port 02 · Commercial" },
  { name: "plannerHandoff", description: "Port 02 — planner → CRM handoff", defaultValue: DEFAULT_FLAGS.plannerHandoff, group: "Port 02 · Commercial" },
  { name: "plannerUnderlay", description: "Port 02 — floor-plan underlay + calibrate", defaultValue: DEFAULT_FLAGS.plannerUnderlay, group: "Port 02 · Commercial" },
  { name: "floorPlanImport", description: "Port 02 — import floor-plan image", defaultValue: DEFAULT_FLAGS.floorPlanImport, group: "Port 02 · Commercial" },

  // Port 03
  { name: "studioExportSvg", description: "Port 03 — Studio export SVG", defaultValue: DEFAULT_FLAGS.studioExportSvg, group: "Port 03 · Studio catalog" },
  { name: "studioExportJson", description: "Port 03 — Studio export JSON", defaultValue: DEFAULT_FLAGS.studioExportJson, group: "Port 03 · Studio catalog" },
  { name: "studioExportPng", description: "Port 03 — Studio export PNG", defaultValue: DEFAULT_FLAGS.studioExportPng, group: "Port 03 · Studio catalog" },
  { name: "studioExportJpg", description: "Port 03 — Studio export JPG", defaultValue: DEFAULT_FLAGS.studioExportJpg, group: "Port 03 · Studio catalog" },
  { name: "studioExportDxf", description: "Port 03 — Studio export DXF", defaultValue: DEFAULT_FLAGS.studioExportDxf, group: "Port 03 · Studio catalog" },
  { name: "studioImportFiles", description: "Port 03 — Studio import SVG/JSON/images", defaultValue: DEFAULT_FLAGS.studioImportFiles, group: "Port 03 · Studio catalog" },
  { name: "studioPublishCatalog", description: "Port 03 — publish furniture to catalog", defaultValue: DEFAULT_FLAGS.studioPublishCatalog, group: "Port 03 · Studio catalog" },
  { name: "studioCatalogLifecycle", description: "Port 03 — draft/live/retired lifecycle", defaultValue: DEFAULT_FLAGS.studioCatalogLifecycle, group: "Port 03 · Studio catalog" },

  // Planner exports
  { name: "plannerExportPdf", description: "Planner PDF export", defaultValue: DEFAULT_FLAGS.plannerExportPdf, group: "Planner exports" },
  { name: "plannerExportPng", description: "Planner PNG export", defaultValue: DEFAULT_FLAGS.plannerExportPng, group: "Planner exports" },
  { name: "plannerExportSvg", description: "Planner SVG export", defaultValue: DEFAULT_FLAGS.plannerExportSvg, group: "Planner exports" },
  { name: "plannerExportDxf", description: "Planner DXF export", defaultValue: DEFAULT_FLAGS.plannerExportDxf, group: "Planner exports" },

  // AI
  { name: "plannerAiAdvisor", description: "Planner AI advisor panel", defaultValue: DEFAULT_FLAGS.plannerAiAdvisor, group: "AI" },
  { name: "plannerAiSpaceSuggest", description: "Port 04 — AI space-suggest", defaultValue: DEFAULT_FLAGS.plannerAiSpaceSuggest, group: "AI" },
  { name: "sketchToPlan", description: "Port 04 — sketch image to walls/rooms", defaultValue: DEFAULT_FLAGS.sketchToPlan, group: "AI" },
  { name: "siteAiAdvisor", description: "Marketing site AI advisor", defaultValue: DEFAULT_FLAGS.siteAiAdvisor, group: "AI" },

  // Sync
  { name: "plannerCloudSync", description: "Disk / cloud project sync", defaultValue: DEFAULT_FLAGS.plannerCloudSync, group: "Sync" },
  { name: "plannerGuestWorkspace", description: "Guest workspace entry", defaultValue: DEFAULT_FLAGS.plannerGuestWorkspace, group: "Sync" },

  // Admin modules
  { name: "adminPlans", description: "Admin · Plans", defaultValue: DEFAULT_FLAGS.adminPlans, group: "Admin modules" },
  { name: "adminCatalog", description: "Admin · Products catalog", defaultValue: DEFAULT_FLAGS.adminCatalog, group: "Admin modules" },
  { name: "adminConfiguratorCatalog", description: "Admin · Configurator catalog", defaultValue: DEFAULT_FLAGS.adminConfiguratorCatalog, group: "Admin modules" },
  { name: "adminWorkspaceCatalog", description: "Admin · Workspace library", defaultValue: DEFAULT_FLAGS.adminWorkspaceCatalog, group: "Admin modules" },
  { name: "adminFurnitureStudio", description: "Admin · Furniture Studio link", defaultValue: DEFAULT_FLAGS.adminFurnitureStudio, group: "Admin modules" },
  { name: "adminPriceBooks", description: "Admin · Price books", defaultValue: DEFAULT_FLAGS.adminPriceBooks, group: "Admin modules" },
  { name: "adminAnalytics", description: "Admin · Analytics", defaultValue: DEFAULT_FLAGS.adminAnalytics, group: "Admin modules" },
  { name: "adminCrm", description: "Admin · CRM hub", defaultValue: DEFAULT_FLAGS.adminCrm, group: "Admin modules" },
  { name: "adminCustomerQueries", description: "Admin · Customer queries", defaultValue: DEFAULT_FLAGS.adminCustomerQueries, group: "Admin modules" },
  { name: "adminThemes", description: "Admin · Themes", defaultValue: DEFAULT_FLAGS.adminThemes, group: "Admin modules" },
  { name: "adminSettings", description: "Admin · Settings", defaultValue: DEFAULT_FLAGS.adminSettings, group: "Admin modules" },
  { name: "adminDesignKit", description: "Admin · Design kit", defaultValue: DEFAULT_FLAGS.adminDesignKit, group: "Admin modules" },
  { name: "adminInventory", description: "Admin · Routes inventory", defaultValue: DEFAULT_FLAGS.adminInventory, group: "Admin modules" },
  { name: "adminFeatureToggle", description: "Admin · Feature flags page", defaultValue: DEFAULT_FLAGS.adminFeatureToggle, group: "Admin modules" },
] as const;

/** Map admin nav href → flag that gates the module in the console. */
export const ADMIN_NAV_FLAG_BY_HREF: Readonly<Record<string, FeatureFlagName>> = {
  "/admin/plans": "adminPlans",
  "/admin/features": "adminFeatureToggle",
  "/admin/analytics": "adminAnalytics",
  "/admin/catalog": "adminCatalog",
  "/admin/planner-catalog": "adminConfiguratorCatalog",
  "/admin/workspace-catalog": "adminWorkspaceCatalog",
  "/oostudio": "adminFurnitureStudio",
  "/admin/price-books": "adminPriceBooks",
  "/admin/crm": "adminCrm",
  "/admin/crm/clients": "adminCrm",
  "/admin/crm/projects": "adminCrm",
  "/admin/crm/quotes": "adminCrm",
  "/admin/customer-queries": "adminCustomerQueries",
  "/admin/settings": "adminSettings",
  "/admin/themes": "adminThemes",
  "/admin/inventory": "adminInventory",
  "/admin/design-kit": "adminDesignKit",
};

let runtimeFlags: FeatureFlags = { ...DEFAULT_FLAGS };

export function getAllFlagNames(): FeatureFlagName[] {
  return Object.keys(DEFAULT_FLAGS) as FeatureFlagName[];
}

export function getFeatureFlags(): FeatureFlags {
  return { ...runtimeFlags };
}

export function isFeatureEnabled(name: FeatureFlagName): boolean {
  return Boolean(runtimeFlags[name]);
}

export function setFeatureFlags(updates: Partial<FeatureFlags>): FeatureFlags {
  runtimeFlags = { ...runtimeFlags, ...updates };
  return getFeatureFlags();
}

/** Reset in-memory overrides to shipped defaults (tests). */
export function resetFeatureFlagsToDefaults(): FeatureFlags {
  runtimeFlags = { ...DEFAULT_FLAGS };
  return getFeatureFlags();
}

export function getAllFlagsGrouped(): Array<{
  group: string;
  flags: Array<{ name: FeatureFlagName; description: string; defaultValue: boolean }>;
}> {
  const byGroup = new Map<
    string,
    Array<{ name: FeatureFlagName; description: string; defaultValue: boolean }>
  >();
  for (const meta of FLAG_META) {
    const list = byGroup.get(meta.group) ?? [];
    list.push({
      name: meta.name,
      description: meta.description,
      defaultValue: meta.defaultValue,
    });
    byGroup.set(meta.group, list);
  }
  return [...byGroup.entries()].map(([group, flags]) => ({ group, flags }));
}

/** Filter admin nav items by module flags (dashboard always kept). */
export function filterAdminNavItemsByFlags<T extends { href: string }>(
  items: readonly T[],
  flags: FeatureFlags = getFeatureFlags(),
): T[] {
  return items.filter((item) => {
    if (item.href === "/admin" || item.href === "/admin/") return true;
    const flag = ADMIN_NAV_FLAG_BY_HREF[item.href];
    if (!flag) return true;
    return flags[flag] !== false;
  });
}

export function isAdminModuleEnabled(
  href: string,
  flags: FeatureFlags = getFeatureFlags(),
): boolean {
  if (href === "/admin" || href === "/admin/") return true;
  const flag = ADMIN_NAV_FLAG_BY_HREF[href];
  if (!flag) return true;
  return flags[flag] !== false;
}
