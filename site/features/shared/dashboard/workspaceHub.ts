import type { Icon } from "@phosphor-icons/react";
import {
  Compass,
  SquaresFour as LayoutDashboard,
  UserCircle,
  Package,
  Scales,
  ChatCircle,
  DownloadSimple,
} from "@phosphor-icons/react";

export type WorkspaceHubItem = {
  href: string;
  label: string;
  description: string;
  icon: Icon;
};

export type WorkspaceHubSection = {
  title: string;
  summary: string;
  items: WorkspaceHubItem[];
};

/** Member workspace hub only — admin tools live under `/admin` (see `adminNav.ts`). */
export const WORKSPACE_HUB_SECTIONS: WorkspaceHubSection[] = [
  {
    title: "Planner & workspace",
    summary: "Layout, catalog furniture, 3D review, export, and BOQ path.",
    items: [
      {
        href: "/ooplanner",
        label: "Open canvas",
        description: "Jump into the signed-in planner for office furniture layouts.",
        icon: LayoutDashboard,
      },
      {
        href: "/choose-product",
        label: "Planner entry",
        description: "Pick how you enter the planner (member or guest launch).",
        icon: Compass,
      },
      {
        href: "/portal",
        label: "Member portal",
        description: "Review shared plans and member project context.",
        icon: UserCircle,
      },
    ],
  },
  {
    title: "Catalog & shortlist",
    summary: "Browse inventory and prepare commercial follow-through.",
    items: [
      {
        href: "/products",
        label: "Product catalog",
        description: "Office furniture categories for real workplace projects.",
        icon: Package,
      },
      {
        href: "/compare",
        label: "Compare shortlist",
        description: "Side-by-side product comparison before quote.",
        icon: Scales,
      },
      {
        href: "/downloads",
        label: "Resource Desk",
        description: "Catalogs, technical sheets, and planning references.",
        icon: DownloadSimple,
      },
    ],
  },
  {
    title: "Sales & support",
    summary: "Reach the team for quotes and delivery next steps.",
    items: [
      {
        href: "/contact?intent=quote&source=dashboard",
        label: "Contact sales",
        description: "Quotes and planning for Patna, Ranchi, Bihar, and Jharkhand.",
        icon: ChatCircle,
      },
      {
        href: "/planner",
        label: "Planner overview",
        description: "Public planner landing, features, and help entry.",
        icon: Compass,
      },
    ],
  },
];
