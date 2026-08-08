export const crmUi = {
  inverseTitle: "text-strong",
  inverseBody: "text-body",
  inverseMuted: "text-muted",
  inverseSubtle: "text-subtle",
  panelBorder: "border-[color:var(--border-soft)]",
  softBorder: "border-[color:var(--border-soft)]",
  softSurface: "bg-[color:var(--surface-soft)]",
  strongSurface: "bg-[color:var(--surface-panel-strong)]",
  hoverSurface: "hover:bg-[color:var(--surface-soft)]",
  hoverBorder: "hover:border-[color:var(--border-strong)]",
  emptyState: "border border-dashed border-[color:var(--overlay-panel-12)]",
  modal: "bg-[color:var(--surface-panel-strong)] border border-[color:var(--border-soft)] rounded-[2rem] shadow-theme-float",
  iconChip:
    "bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary",
  ghostDanger:
    "text-inverse-subtle hover:text-danger hover:bg-danger-soft transition",
  ghostInverse:
    "text-inverse-muted hover:text-inverse hover:bg-[color:var(--overlay-panel-08)] transition",
} as const;

const neutralBadge =
  "border border-[color:var(--border-soft)] bg-[color:var(--surface-soft)] text-muted";

export const crmProjectStatus = {
  active: {
    label: "Active",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-success)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success)_12%,transparent)] text-success",
    dot: "bg-[var(--color-success)]",
  },
  completed: {
    label: "Completed",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-primary)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-primary)_12%,transparent)] text-primary",
    dot: "bg-primary",
  },
  archived: {
    label: "Archived",
    badge: neutralBadge,
    dot: "bg-[var(--text-subtle)]",
  },
  on_hold: {
    label: "On Hold",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-warning)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-warning",
    dot: "bg-[var(--color-warning)]",
  },
} as const;

export const crmQuoteStatusColumns = [
  {
    value: "draft",
    label: "Draft",
    badge: neutralBadge,
    header:
      "border-b border-[color:var(--border-soft)] bg-[color:var(--surface-soft)]",
    dot: "bg-[var(--text-subtle)]",
    valueTone: "text-muted",
  },
  {
    value: "sent",
    label: "Sent",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-warning)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-warning)_12%,transparent)] text-warning",
    header:
      "border-b border-[color:color-mix(in_srgb,var(--color-warning)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-warning)_8%,transparent)]",
    dot: "bg-[var(--color-warning)]",
    valueTone: "text-warning",
  },
  {
    value: "approved",
    label: "Approved",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-success)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success)_12%,transparent)] text-success",
    header:
      "border-b border-[color:color-mix(in_srgb,var(--color-success)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-success)_8%,transparent)]",
    dot: "bg-[var(--color-success)]",
    valueTone: "text-success",
  },
  {
    value: "rejected",
    label: "Rejected",
    badge:
      "border border-[color:color-mix(in_srgb,var(--color-danger)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-danger)_12%,transparent)] text-danger",
    header:
      "border-b border-[color:color-mix(in_srgb,var(--color-danger)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--color-danger)_8%,transparent)]",
    dot: "bg-[var(--color-danger)]",
    valueTone: "text-danger",
  },
] as const;
