export interface CategoryApiItem {
  id: string;
  name: string;
  count?: number;
  subcategories?: CategorySubcategoryItem[];
}

export interface CategorySubcategoryItem {
  id: string;
  name: string;
  count?: number;
  href: string;
}

export interface GroupedCategory {
  groupId: string;
  groupLabel: string;
  items: Array<CategoryApiItem & { href: string }>;
}

export const NAV_CATEGORY_GROUP_ORDER = [
  "seating",
  "workstations",
  "tables",
  "storages",
  "soft-seating",
  "education",
] as const;

export const NAV_CATEGORY_GROUPS: Record<
  (typeof NAV_CATEGORY_GROUP_ORDER)[number],
  { label: string; ids: string[] }
> = {
  seating: {
    label: "Seating",
    ids: ["seating"],
  },
  workstations: {
    label: "Workstations",
    ids: ["workstations"],
  },
  tables: {
    label: "Tables",
    ids: ["tables"],
  },
  storages: {
    label: "Storages",
    ids: ["storages"],
  },
  "soft-seating": {
    label: "Soft Seating",
    ids: ["soft-seating"],
  },
  education: {
    label: "Education",
    ids: ["education"],
  },
};

const CATEGORY_TO_GROUP = new Map<string, (typeof NAV_CATEGORY_GROUP_ORDER)[number]>();

for (const groupId of NAV_CATEGORY_GROUP_ORDER) {
  for (const categoryId of NAV_CATEGORY_GROUPS[groupId].ids) {
    CATEGORY_TO_GROUP.set(categoryId, groupId);
  }
}

export function groupCategories(categories: CategoryApiItem[]): GroupedCategory[] {
  const grouped = new Map<(typeof NAV_CATEGORY_GROUP_ORDER)[number], CategoryApiItem[]>();

  for (const groupId of NAV_CATEGORY_GROUP_ORDER) {
    grouped.set(groupId, []);
  }

  for (const item of categories) {
    const groupId = CATEGORY_TO_GROUP.get(item.id);
    if (!groupId) {continue;}
    grouped.get(groupId)?.push(item);
  }

  return NAV_CATEGORY_GROUP_ORDER.map((groupId) => {
    const orderedIds = NAV_CATEGORY_GROUPS[groupId].ids;
    const items = (grouped.get(groupId) || [])
      .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
      .map((item) => ({
        ...item,
        href: `/products/${item.id}`,
        subcategories: item.subcategories || [],
      }));

    return {
      groupId,
      groupLabel: NAV_CATEGORY_GROUPS[groupId].label,
      items,
    };
  }).filter((group) => group.items.length > 0);
}

export const NAV_PRIMARY_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products", hasMega: true },
  { label: "Solutions", href: "/solutions" },
  { label: "Clients", href: "/clients" },
  { label: "Trusted by", href: "/trusted-by/" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const NAV_RESOURCE_LINKS = [
  { label: "Sustainability", href: "/sustainability" },
  { label: "Refund Policy", href: "/refund-and-return-policy" },
] as const;
