export interface HelpSection {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  /** Links to a dedicated feature marketing page when set */
  featureSlug?: string;
}

export interface HelpFaqItem {
  question: string;
  answer: string;
}

export const PLANNER_HELP_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting started",
    summary: "Open the planner, upload a reference image or pick a template, then place your first desk.",
    keywords: ["start", "template", "new", "blank", "reference", "upload"],
  },
  {
    id: "reference-images",
    title: "Reference images",
    summary: "Upload a JPG, PNG, WebP, GIF, or SVG as a non-editable underlay so you can trace or compare against it.",
    keywords: ["reference", "image", "upload", "underlay", "sketch", "floor plan", "svg"],
  },
  {
    id: "canvas-basics",
    title: "Canvas basics",
    summary: "Pan, zoom, and select objects on the floor plan canvas.",
    keywords: ["pan", "zoom", "select", "canvas"],
  },
  {
    id: "catalog-and-blocks",
    title: "Catalog and blocks",
    summary: "Drag furniture from the library; symbols are mm-accurate vectors.",
    keywords: ["catalog", "desk", "bench", "drag", "library"],
    featureSlug: "catalog",
  },
  {
    id: "walls-and-rooms",
    title: "Walls and rooms",
    summary: "Press and drag to draw walls; add door and window openings on wall segments.",
    keywords: ["wall", "room", "door", "window", "drag"],
  },
  {
    id: "select-and-edit",
    title: "Select and edit",
    summary: "Select blocks, rotate them, and adjust width or seating in the inspector.",
    keywords: ["select", "rotate", "inspector", "properties", "resize"],
    featureSlug: "catalog",
  },
  {
    id: "infrastructure-icons",
    title: "Infrastructure icons",
    summary: "Place APs, displays, badge readers, and outlets for visual planning only.",
    keywords: ["ap", "wifi", "display", "outlet", "badge"],
  },
  {
    id: "layers-and-visibility",
    title: "Layers and visibility",
    summary: "Toggle furniture, walls, and infrastructure layers independently.",
    keywords: ["layer", "hide", "show", "visibility", "toggle"],
  },
  {
    id: "measurements",
    title: "Measurements and area",
    summary: "Add dimension lines and read total area from the status bar.",
    keywords: ["measure", "dimension", "area", "mm"],
    featureSlug: "measure",
  },
  {
    id: "ai-assistant",
    title: "AI assistant",
    summary: "Chat, auto-furnish, and layout wizard with ghost preview before apply.",
    keywords: ["ai", "furnish", "wizard", "chat"],
    featureSlug: "ai-assist",
  },
  {
    id: "export-and-share",
    title: "Export and PDF",
    summary: "Branded PDF export with optional BOQ table.",
    keywords: ["export", "pdf", "boq", "print"],
    featureSlug: "export",
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard shortcuts",
    summary: "Ctrl+Tab cycles view modes; Escape closes panels.",
    keywords: ["shortcut", "keyboard", "ctrl"],
  },
  {
    id: "saving-and-autosave",
    title: "Saving and autosave",
    summary:
      "Plans autosave in this browser (local storage). Clearing site data removes them. Account cloud save is not enabled for the workspace planner yet.",
    keywords: ["autosave", "save", "restore", "reload", "local"],
  },
  {
    id: "guest-vs-member",
    title: "Guest vs member",
    summary:
      "Guest explores the canvas with local drafts; members unlock more export/workspace tools. Workspace plan durability is still local browser storage until cloud save ships.",
    keywords: ["guest", "login", "save", "member"],
  },
  {
    id: "faq",
    title: "FAQ",
    summary: "Common questions about accuracy, browsers, and save behaviour.",
    keywords: ["faq", "browser", "save", "offline"],
  },
];

export const PLANNER_HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    question: "How do I get started with the planner?",
    answer: "Open the planner, upload a reference image or pick a template, and place your first desk.",
  },
  {
    question: "Can I upload a sketch or floor plan as a reference?",
    answer: "Yes. Upload a JPG, PNG, WebP, GIF, or SVG and the planner places it on the canvas as a non-editable reference underlay.",
  },
  {
    question: "What does the canvas support?",
    answer: "Pan, zoom, and select objects on the floor plan canvas.",
  },
  {
    question: "Can I drag furniture from the catalog?",
    answer: "Yes. Drag furniture from the library; symbols are mm-accurate vectors.",
  },
  {
    question: "How do walls, rooms, doors, and windows work?",
    answer:
      "Press and drag on the canvas to draw a wall segment (release to commit). Add door and window openings on existing walls. Room outline tooling is deferred — use wall segments or a starter room.",
  },
  {
    question: "How are plans saved?",
    answer:
      "Sessions autosave to this browser’s local storage. Use Save draft / Save for an immediate local flush. Account cloud save is not enabled for planner yet — export JSON if you need a portable backup.",
  },
  {
    question: "What is guest mode for?",
    answer:
      "Guest explores the canvas with local drafts; members unlock more export/workspace tools. Workspace plan durability is still local browser storage until cloud save ships.",
  },
  {
    question: "Can I export a plan as a PDF?",
    answer: "Yes. The planner supports branded PDF export with an optional BOQ table.",
  },
  {
    question: "Can the planner help with layout ideas?",
    answer: "Yes. The AI assistant can chat, auto-furnish, and preview a layout before you apply it.",
  },
];
