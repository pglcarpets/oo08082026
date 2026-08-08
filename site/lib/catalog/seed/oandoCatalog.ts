// ---------------------------------------------------------------------------
// Oando catalog seed (Plan D / D3)
// ---------------------------------------------------------------------------
// Typed seed derived from the owner's 13 spec sheets (csv/Workstation and basic
// storages website*.csv). Those sheets are merged-cell price lists, not one-row-
// per-SKU tables, so a generic parser would be fragile — this hand-built seed is
// deterministic, fully typed, and validated end-to-end by lib/catalog/geometry.ts
// (every product must resolve to a numeric footprint; see tests/catalog-seed.test.ts).
//
// No pricing (owner spec). Thumbnails/3D left empty — procedural 2D blocks draw
// everything to scale today; real renders attach per-product in admin later.

import type { DerivedRules, Product, SizeOption, WorkstationSpec } from "../types";

const EPOCH = new Date(0).toISOString();

// Screen offsets confirmed by sheet 5: intermediate 600→525/750→675 (−75),
// main 1200→1050/1350→1200/1500→1350 (−150).
const STANDARD_DERIVED: DerivedRules = {
  screenOffsetIntermediate: 75,
  screenOffsetMain: 150,
};

const LENGTHS = [1200, 1350, 1500];
const DEPTHS = [600, 750];
const L_ARMS = [1200, 1350, 1500];

function base(
  id: string,
  name: string,
  category_id: string,
  family: string,
): Omit<Product, "sizingType"> {
  return {
    id,
    category_id,
    series: family.toLowerCase().replace(/\s+/g, "-"),
    name,
    slug: id,
    images: [],
    description: "",
    family,
    brandName: name,
    specs: { dimensions: "", materials: ["Pre-laminate particle board", "MS powder-coated"], features: [] },
    series_id: `${category_id}-${family.toLowerCase().replace(/\s+/g, "-")}`,
    series_name: family,
    created_at: EPOCH,
    metadata: { source: "oando-seed", category: category_id },
  };
}

// --- Workstations (parametric) ---------------------------------------------

function workstation(
  id: string,
  name: string,
  spec: WorkstationSpec,
): Product {
  return {
    ...base(id, name, "workstations", spec.shape === "l-shape" ? "L-Shape" : "Linear"),
    sizingType: "parametric",
    workstation: spec,
    derivedRules: STANDARD_DERIVED,
  };
}

const STRAIGHT_SEATERS_NS = [1, 2, 3, 4, 5];
const STRAIGHT_SEATERS_SH = [2, 4, 6, 8, 10];
const L_SEATERS_NS = [1, 2, 3, 4];
const L_SEATERS_SH = [2, 4, 6, 8];

export const WORKSTATIONS: Product[] = [
  // Sheet 1 & 2 — Linear (leg system), 250mm raceway / Flipdown tray
  workstation("oando-ws-linear", "Linear Workstation", {
    shape: "straight",
    system: "leg",
    wireManagement: ["250mm Raceway + 65mm Grommet", "MS Flipdown Tray + 450mm Aluminium Flip-Up"],
    sharing: "non-sharing",
    seaterOptions: [...STRAIGHT_SEATERS_NS, ...STRAIGHT_SEATERS_SH],
    lengthOptions: LENGTHS,
    depthOptions: DEPTHS,
    heightMm: 750,
  }),
  // Sheet 9 — Linear, Partition ("Panel") system
  workstation("oando-ws-linear-panel", "Linear Panel Workstation", {
    shape: "straight",
    system: "partition",
    wireManagement: ["65mm Grommet + below-top metal raceway tile (Panel)"],
    sharing: "non-sharing",
    seaterOptions: [...STRAIGHT_SEATERS_NS, ...STRAIGHT_SEATERS_SH],
    lengthOptions: LENGTHS,
    depthOptions: DEPTHS,
    heightMm: 750,
  }),
  // Sheet 3 & 4 — L-Shape (leg system). Main arm L1 standard 1500; return L2 1200/1350/1500.
  workstation("oando-ws-lshape", "L-Shape Workstation", {
    shape: "l-shape",
    system: "leg",
    wireManagement: ["250mm Raceway + 65mm Grommet", "MS Flipdown Tray + 450mm Aluminium Flip-Up"],
    sharing: "non-sharing",
    seaterOptions: [...L_SEATERS_NS, ...L_SEATERS_SH],
    lengthOptions: [1500], // standard main arm (owner: other combinations allowed via admin)
    depthOptions: [600],
    heightMm: 750,
    armOptions: L_ARMS,
  }),
  // Sheet 10 — L-Shape, Partition ("Panel") system
  workstation("oando-ws-lshape-panel", "L-Shape Panel Workstation", {
    shape: "l-shape",
    system: "partition",
    wireManagement: ["65mm Grommet + below-top metal raceway tile (Panel)"],
    sharing: "non-sharing",
    seaterOptions: [...L_SEATERS_NS, ...L_SEATERS_SH],
    lengthOptions: [1500],
    depthOptions: [600],
    heightMm: 750,
    armOptions: L_ARMS,
  }),
];

// --- Storage (discrete) — sheet 7 ------------------------------------------

function discrete(
  id: string,
  name: string,
  category_id: string,
  family: string,
  sizeOptions: SizeOption[],
): Product {
  return { ...base(id, name, category_id, family), sizingType: "discrete", sizeOptions };
}

const PED = (sku: string, label: string, dim = { L: 400, D: 450, H: 600 }): SizeOption => ({ sku, label, dim });

export const STORAGE: Product[] = [
  discrete("oando-pedestal", "Pedestal", "storage", "Pedestal", [
    PED("PED-1D1F", "1 Drawer + 1 Filing"),
    PED("PED-2D1F", "2 Drawer + 1 Filing"),
    PED("PED-2EQ-1L", "2 Equal Drawer, single lock"),
    PED("PED-2EQ-2L", "2 Equal Drawer, individual lock"),
    PED("PED-3EQ-1L", "3 Equal Drawer, single lock"),
    PED("PED-3EQ-3L", "3 Equal Drawer, individual lock"),
    PED("PED-4EQ-1L", "4 Equal Drawer, single lock"),
    PED("PED-4EQ-2L", "4 Equal Drawer, two lock"),
    PED("PED-4EQ-4L", "4 Equal Drawer, individual lock"),
    PED("PED-MOBILE", "2 Drawer + 1 Filing, mobile + height-adjustable", { L: 600, D: 450, H: 600 }),
  ]),
  discrete("oando-storage-unit", "Storage Unit", "storage", "Storage", [
    { sku: "STG-LOW-750", label: "Low Height, openable shutter", dim: { L: 750, D: 450, H: 750 } },
    { sku: "STG-LOW-900", label: "Low Height, openable shutter", dim: { L: 900, D: 450, H: 750 } },
    { sku: "STG-LOW-1050", label: "Low Height, openable shutter", dim: { L: 1050, D: 450, H: 750 } },
    { sku: "STG-MED-750", label: "Medium Height, openable shutter", dim: { L: 750, D: 450, H: 1200 } },
    { sku: "STG-MED-900", label: "Medium Height, openable shutter", dim: { L: 900, D: 450, H: 1200 } },
    { sku: "STG-MED-1050", label: "Medium Height, openable shutter", dim: { L: 1050, D: 450, H: 1200 } },
    { sku: "STG-FULL-1800-750", label: "Full Height, openable shutter", dim: { L: 750, D: 450, H: 1800 } },
    { sku: "STG-FULL-1800-900", label: "Full Height, openable shutter", dim: { L: 900, D: 450, H: 1800 } },
    { sku: "STG-FULL-1800-1050", label: "Full Height, openable shutter", dim: { L: 1050, D: 450, H: 1800 } },
    { sku: "STG-FULL-2100-750", label: "Full Height (2100), openable shutter", dim: { L: 750, D: 450, H: 2100 } },
    { sku: "STG-FULL-2100-900", label: "Full Height (2100), openable shutter", dim: { L: 900, D: 450, H: 2100 } },
    { sku: "STG-FULL-2100-1050", label: "Full Height (2100), openable shutter", dim: { L: 1050, D: 450, H: 2100 } },
  ]),
];

// --- Tables (discrete) — sheets 11 & 12 ------------------------------------

export const TABLES: Product[] = [
  discrete("oando-cabin-table", "Cabin Table", "tables", "Cabin", [
    { sku: "CAB-1500-600", label: "1500 × 600", dim: { L: 1500, D: 600, H: 750 } },
    { sku: "CAB-1500-750", label: "1500 × 750", dim: { L: 1500, D: 750, H: 750 } },
    { sku: "CAB-1800-750", label: "1800 × 750", dim: { L: 1800, D: 750, H: 750 } },
    { sku: "CAB-1800-900", label: "1800 × 900", dim: { L: 1800, D: 900, H: 750 } },
  ]),
  discrete("oando-side-table", "Side Table", "tables", "Side", [
    { sku: "SIDE-900", label: "900 × 450", dim: { L: 900, D: 450, H: 750 } },
    { sku: "SIDE-1050", label: "1050 × 450", dim: { L: 1050, D: 450, H: 750 } },
    { sku: "SIDE-1200", label: "1200 × 450", dim: { L: 1200, D: 450, H: 750 } },
    { sku: "SIDE-1350", label: "1350 × 450", dim: { L: 1350, D: 450, H: 750 } },
  ]),
  // Round discussion tables — diameter stored as L = D (procedural block draws a square for now).
  discrete("oando-discussion-table", "Discussion Table", "tables", "Discussion", [
    { sku: "DISC-900", label: "Ø900 (3 pax)", dim: { L: 900, D: 900, H: 750 } },
    { sku: "DISC-1050", label: "Ø1050 (3 pax)", dim: { L: 1050, D: 1050, H: 750 } },
    { sku: "DISC-1200", label: "Ø1200 (4 pax)", dim: { L: 1200, D: 1200, H: 750 } },
  ]),
  discrete("oando-meeting-table", "Meeting / Conference Table", "tables", "Meeting", [
    { sku: "MEET-1800-900", label: "1800 × 900 (6 pax)", dim: { L: 1800, D: 900, H: 750 } },
    { sku: "MEET-2100-1050", label: "2100 × 1050 (6 pax)", dim: { L: 2100, D: 1050, H: 750 } },
    { sku: "MEET-2400-1200", label: "2400 × 1200 (8 pax)", dim: { L: 2400, D: 1200, H: 750 } },
    { sku: "MEET-3000-1200", label: "3000 × 1200 (10 pax)", dim: { L: 3000, D: 1200, H: 750 } },
    { sku: "MEET-3000-1500", label: "3000 × 1500 (10 pax)", dim: { L: 3000, D: 1500, H: 750 } },
    { sku: "MEET-3600-1200", label: "3600 × 1200 (12 pax)", dim: { L: 3600, D: 1200, H: 750 } },
    { sku: "MEET-3600-1500", label: "3600 × 1500 (12 pax)", dim: { L: 3600, D: 1500, H: 750 } },
    { sku: "MEET-4200-1200", label: "4200 × 1200 (14 pax)", dim: { L: 4200, D: 1200, H: 750 } },
    { sku: "MEET-4200-1500", label: "4200 × 1500 (14 pax)", dim: { L: 4200, D: 1500, H: 750 } },
    { sku: "MEET-4500-1200", label: "4500 × 1200 (16 pax)", dim: { L: 4500, D: 1200, H: 750 } },
    { sku: "MEET-4500-1500", label: "4500 × 1500 (16 pax)", dim: { L: 4500, D: 1500, H: 750 } },
    { sku: "MEET-4800-1200", label: "4800 × 1200 (18 pax)", dim: { L: 4800, D: 1200, H: 750 } },
    { sku: "MEET-4800-1500", label: "4800 × 1500 (18 pax)", dim: { L: 4800, D: 1500, H: 750 } },
  ]),
];

/** All seed products in the new parametric shape. */
export function buildOandoSeedProducts(): Product[] {
  return [...WORKSTATIONS, ...STORAGE, ...TABLES];
}
