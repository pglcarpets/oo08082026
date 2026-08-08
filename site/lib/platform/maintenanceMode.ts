export type MaintenanceMode = "off" | "readonly";

const READONLY_VALUES = new Set(["readonly", "true", "1", "on", "yes"]);

export function getMaintenanceMode(): MaintenanceMode {
  const raw = process.env.SITE_MAINTENANCE_MODE?.trim().toLowerCase();
  if (raw && READONLY_VALUES.has(raw)) {
    return "readonly";
  }
  return "off";
}

export function isMaintenanceReadonly(): boolean {
  return getMaintenanceMode() === "readonly";
}

export function maintenanceModeLabel(): string {
  return isMaintenanceReadonly()
    ? "Read-only maintenance — browsing works; admin login and cloud saves are paused."
    : "";
}
