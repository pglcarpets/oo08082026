/**
 * Compatibility shim: admin residual previously called `hydrateCatalog`.
 * Live store: `@planner/store/plannerCatalogStore` (`refresh`).
 */

import { useCatalogStore } from "@planner/store/plannerCatalogStore";

export function usePlannerCatalogStore() {
  return useCatalogStore.getState();
}

usePlannerCatalogStore.getState = () => {
  const s = useCatalogStore.getState();
  return {
    ...s,
    hydrateCatalog: () => s.refresh(),
  };
};
