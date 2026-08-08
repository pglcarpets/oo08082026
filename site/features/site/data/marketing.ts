/**
 * Legacy marketing blocks. Live homepage/category UI uses `homepage.ts` and
 * `routeCopy.ts`. No production page currently imports this module.
 */
export const PRODUCT_CATEGORY_SECTION = {
  eyebrow: "Our range",
  title: "Freedom of Movement",
  subtitle:
    "Designing spaces that adapt to you. Explore our curated configurations that support focus, collaboration, and everything in between.",
  tableTitle: "Configuration guide",
  tableColumns: ["Category", "Best for", "Common setup"],
  tableRows: [
    {
      category: "Seating",
      bestFor: "Daily ergonomic work",
      setup: "Task chairs, executive chairs",
    },
    {
      category: "Workstations",
      bestFor: "Focused team productivity",
      setup: "Linear and cluster desk systems",
    },
    {
      category: "Meeting",
      bestFor: "Collaboration and review",
      setup: "4 to 12 seater table variants",
    },
    {
      category: "Storage",
      bestFor: "Document and utility control",
      setup: "Pedestals, cabinets, lockers",
    },
  ],
  cta: {
    label: "Show all products",
    href: "/products",
  },
  items: [
    {
      name: "Workstations",
      description:
        "High-quality design, clear design language and technical innovation",
      image: "/assets/marketing/ui/categories/workstations-clean.webp",
      href: "/products?category=workstations",
    },
    {
      name: "Office Chairs",
      description: "Ergonomic task and executive seating for every workspace",
      image: "/assets/marketing/ui/categories/seating-clean.webp",
      href: "/products?category=seating",
    },
    {
      name: "Soft Seating",
      description: "Lounge and collaborative seating for modern offices",
      image: "/assets/marketing/ui/categories/soft-seating-clean.webp",
      href: "/products?category=soft-seating",
    },
    {
      name: "Cafeteria",
      description: "Break room and dining furniture for every team",
      image: "/assets/marketing/clients/TVS/27-06-2025-Image-04.webp",
      href: "/products?category=seating",
    },
    {
      name: "Meeting Tables",
      description: "Conference and collaboration tables for modern teams",
      image: "/assets/marketing/ui/categories/tables-clean.webp",
      href: "/products?category=tables",
    },
    {
      name: "Storage",
      description: "Pedestals, cabinets and shelving with plenty of space",
      image: "/assets/marketing/ui/categories/storages-clean.webp",
      href: "/products?category=storages",
    },
  ],
} as const;
