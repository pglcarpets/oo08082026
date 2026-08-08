/**
 * Local furniture catalog sample for admin analytics / standard-catalog fallback.
 * Built from the shared on-disk furniture seed shape (not the retired cloud-store).
 */

export type LocalFurnitureCatalogItem = {
  id: string;
  name: string;
  category: string;
  shape: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  priceInr: number;
  iconPath: string | null;
};

export const categoryLabels: Record<string, string> = {
  desks: "Desks",
  tables: "Tables",
  seating: "Seating",
  "soft-seating": "Soft seating",
  storage: "Storage",
  accessories: "Accessories",
  meeting: "Meeting",
  misc: "Misc",
};

/** Static seed used when Supabase managed products are empty / unconfigured. */
export const furnitureCatalog: LocalFurnitureCatalogItem[] = [
  {
    id: "seed_desk_single",
    name: "Desk 1400",
    category: "desks",
    shape: "rect",
    widthMm: 1400,
    depthMm: 700,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_desk_single_top.svg",
  },
  {
    id: "seed_desk_double",
    name: "Double desk",
    category: "desks",
    shape: "rect",
    widthMm: 2800,
    depthMm: 1400,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_desk_double_top.svg",
  },
  {
    id: "seed_task_chair",
    name: "Task chair",
    category: "seating",
    shape: "chair",
    widthMm: 600,
    depthMm: 600,
    heightMm: 1000,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_task_chair_top.svg",
  },
  {
    id: "seed_exec_chair",
    name: "Executive chair",
    category: "seating",
    shape: "chair",
    widthMm: 700,
    depthMm: 700,
    heightMm: 1200,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_exec_chair_top.svg",
  },
  {
    id: "seed_meeting_rect",
    name: "Meeting table",
    category: "tables",
    shape: "rect",
    widthMm: 2400,
    depthMm: 1200,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_meeting_rect_top.svg",
  },
  {
    id: "seed_meeting_round",
    name: "Round meeting table",
    category: "tables",
    shape: "round",
    widthMm: 1200,
    depthMm: 1200,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_meeting_round_top.svg",
  },
  {
    id: "seed_boardroom_table",
    name: "Boardroom table",
    category: "meeting",
    shape: "rect",
    widthMm: 3600,
    depthMm: 1400,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_boardroom_table_top.svg",
  },
  {
    id: "seed_filing_cabinet",
    name: "Filing cabinet",
    category: "storage",
    shape: "rect",
    widthMm: 900,
    depthMm: 450,
    heightMm: 1200,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_filing_cabinet_top.svg",
  },
  {
    id: "seed_bookshelf",
    name: "Bookshelf",
    category: "storage",
    shape: "rect",
    widthMm: 900,
    depthMm: 400,
    heightMm: 1800,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_bookshelf_top.svg",
  },
  {
    id: "seed_sofa_3",
    name: "3-seat sofa",
    category: "soft-seating",
    shape: "sofa",
    widthMm: 2100,
    depthMm: 900,
    heightMm: 800,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_sofa_3_top.svg",
  },
  {
    id: "seed_sofa_2",
    name: "2-seat sofa",
    category: "soft-seating",
    shape: "sofa",
    widthMm: 1500,
    depthMm: 900,
    heightMm: 800,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_sofa_2_top.svg",
  },
  {
    id: "seed_workstation_4",
    name: "4-seat workstation",
    category: "desks",
    shape: "cluster",
    widthMm: 2800,
    depthMm: 2800,
    heightMm: 750,
    priceInr: 0,
    iconPath: "/api/files/furniture/seed_workstation_4_top.svg",
  },
];
