import { isMaintenanceReadonly, maintenanceModeLabel } from "@/lib/platform/maintenanceMode";

export function MaintenanceBanner() {
  if (!isMaintenanceReadonly()) {return null;}

  return (
    <div
      role="status"
      className="border-b border-accent/40 bg-warning/15 px-4 py-2 text-center text-sm font-medium text-strong"
    >
      {maintenanceModeLabel()}
    </div>
  );
}
