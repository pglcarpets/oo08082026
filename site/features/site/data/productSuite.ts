export const PRODUCT_SUITE = {
  shared: {
    routes: {
      access: "/access",
      chooser: "/choose-product",
      dashboard: "/dashboard",
      login: "/login",
    },
  },
  planner: {
    label: "Workspace Planner",
    description:
      "Client-ready workspace layout with 2D and 3D views, catalog furniture, AI assist, and branded PDF export.",
    routes: {
      landing: "/planner",
      login: "/login",
      /** Guest canvas (after chooser). */
      guest: "/ooplanner",
      /** Public guest entry step — marketing / nav land here first. */
      guestChooser: "/choose-product?mode=guest",
      help: "/planner/help",
      onboarding: "/planner",
      dashboard: "/dashboard",
      canvas: "/ooplanner",
      portal: "/portal",
      shared: "/ooplanner",
    },
  },
  configurator: {
    label: "Configurator",
    description:
      "Unified workspace planner at /planner (configurator catalog).",
    routes: {
      landing: "/planner",
      login: "/login",
      guest: "/ooplanner",
      guestChooser: "/choose-product?mode=guest",
      onboarding: "/planner",
      dashboard: "/dashboard",
      canvas: "/ooplanner",
    },
  },
  admin: {
    label: "Admin",
    description: "Internal operations and product oversight.",
    routes: {
      landing: "/admin",
      login: "/login",
    },
  },
} as const;

export type ProductSuiteKey = keyof typeof PRODUCT_SUITE;
