"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryStates } from "nuqs";
import { useAction } from "next-safe-action/hooks";
import { CircleNotch as Loader2, Plus, ArrowsClockwise as RefreshCw, MagnifyingGlass as Search } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import { useCatalogStore } from "@planner/store/plannerCatalogStore";
import { unwrapActionResult } from "@/lib/unwrapActionResult";
import { adminCatalogSearchParams } from "./adminCatalogSearchParams";
import {
  createConfiguratorCatalogItemAction,
  createStandardCatalogItemAction,
  deleteConfiguratorCatalogItemAction,
  deleteStandardCatalogItemAction,
  patchConfiguratorCatalogItemAction,
  patchStandardCatalogItemAction,
  setConfiguratorCatalogActiveAction,
} from "./catalogItemActions";
import { AdminField, AdminSelect, AdminTextInput } from "../ui/AdminFormFields";
import { AdminAlert } from "../ui/AdminAlert";
import { AdminLoadingPanel } from "../ui/AdminLoadingPanel";
import { AdminCatalogEditorDrawer } from "./AdminCatalogEditorDrawer";
import { AdminCatalogTable } from "./AdminCatalogTable";
import {
  fetchAdminCatalog,
  type ConfiguratorCatalogItem,
  type StandardCatalogItem,
} from "../api/adminCatalogClient";
import {
  ADMIN_CATALOG_PAGE_SIZE,
  type CatalogListProps,
  type CatalogManagerItem,
  type EditorMode,
  emptyConfiguratorDraft,
  emptyStandardDraft,
  configuratorDraftToPayload,
  configuratorFromItem,
  getConfiguratorJsonErrors,
  standardDraftToPayload,
  standardFromItem,
  validateConfiguratorDraft,
  validateStandardDraft,
} from "./adminCatalogManagerUtils";

export function AdminCatalogManager({
  title,
  description,
  catalogType,
}: CatalogListProps) {
  const isStandard = catalogType === "standard";
  const [items, setItems] = useState<CatalogManagerItem[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterState, setFilterState] = useQueryStates(adminCatalogSearchParams, {
    history: "push",
    scroll: false,
    shallow: true,
  });
  const { search, page } = filterState;
  const categoryFilter = filterState.category;
  const visibleFilter = filterState.visible;
  const setPage = useCallback(
    (value: number) => setFilterState({ ...filterState, page: value }),
    [filterState, setFilterState],
  );
  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [standardDraft, setStandardDraft] = useState(emptyStandardDraft);
  const [configuratorDraft, setConfiguratorDraft] = useState(emptyConfiguratorDraft);
  const [showAdvancedJson, setShowAdvancedJson] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [shellActionsReady, setShellActionsReady] = useState(false);
  const { executeAsync: createStandardItem } = useAction(createStandardCatalogItemAction);
  const { executeAsync: patchStandardItem } = useAction(patchStandardCatalogItemAction);
  const { executeAsync: deleteStandardItem } = useAction(deleteStandardCatalogItemAction);
  const { executeAsync: createConfiguratorItem } = useAction(
    createConfiguratorCatalogItemAction,
  );
  const { executeAsync: patchConfiguratorItem } = useAction(
    patchConfiguratorCatalogItemAction,
  );
  const { executeAsync: setConfiguratorActive } = useAction(
    setConfiguratorCatalogActiveAction,
  );
  const { executeAsync: deleteConfiguratorItem } = useAction(
    deleteConfiguratorCatalogItemAction,
  );

  const readOnly = isStandard && source === "local-catalog";
  const configuratorJsonErrors = useMemo(
    () => getConfiguratorJsonErrors(configuratorDraft),
    [configuratorDraft],
  );

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const query: Record<string, string | number | undefined> = {
        page,
        limit: ADMIN_CATALOG_PAGE_SIZE,
      };

      if (isStandard) {
        if (search.trim()) {query.search = search.trim();}
        if (categoryFilter) {query.category = categoryFilter;}
        if (visibleFilter) {query.visible = visibleFilter;}
      }

      const payload = await fetchAdminCatalog(catalogType, query);
      const rows = (payload.items ?? payload.catalog_items ?? []) as CatalogManagerItem[];

      setItems(rows);
      setTotal(payload.pagination?.total ?? payload.total ?? rows.length);
      setSource(payload.source ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, [catalogType, categoryFilter, isStandard, page, search, visibleFilter]);

  useEffect(() => {
    function markShellActionsReady() {
      setShellActionsReady(true);
    }
    markShellActionsReady();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadItems();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadItems]);

  const categories = useMemo(() => {
    const nextCategories = new Set<string>();
    for (const item of items) {
      if (item.category) {nextCategories.add(item.category);}
    }
    return [...nextCategories].sort();
  }, [items]);

  const filteredConfiguratorItems = useMemo(() => {
    if (isStandard) {return items;}

    let rows = items;

    if (categoryFilter) {
      rows = rows.filter((item) => item.category === categoryFilter);
    }

    if (visibleFilter === "true") {
      rows = rows.filter((item) => item.active !== false);
    }

    if (visibleFilter === "false") {
      rows = rows.filter((item) => item.active === false);
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      rows = rows.filter((item) =>
        [item.name, item.category, "slug" in item ? item.slug : ""]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      );
    }

    return rows;
  }, [categoryFilter, isStandard, items, search, visibleFilter]);

  const filteredStandardFallbackItems = useMemo(() => {
    if (!readOnly) {return items;}

    let rows = items as StandardCatalogItem[];

    if (categoryFilter) {
      rows = rows.filter((item) => item.category === categoryFilter);
    }

    if (visibleFilter) {
      const visible = visibleFilter === "true";
      rows = rows.filter(
        (item) => (item.visible !== false && item.active !== false) === visible,
      );
    }

    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter((item) =>
        [item.id, item.name, item.category, item.subcategory, item.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query)),
      );
    }

    return rows;
  }, [categoryFilter, items, readOnly, search, visibleFilter]);

  const displayItems = isStandard ? filteredStandardFallbackItems : filteredConfiguratorItems;
  const hasActiveFilters = Boolean(search.trim() || categoryFilter || visibleFilter);
  const displayTotal = readOnly && hasActiveFilters ? displayItems.length : total;

  const clearFilters = () => {
    setFilterState({ ...filterState, search: "", category: "", visible: "", page: 1 });
  };

  const openCreate = () => {
    if (readOnly) {return;}

    setEditorMode("create");
    setStandardDraft(emptyStandardDraft());
    setConfiguratorDraft(emptyConfiguratorDraft());
    setShowAdvancedJson(false);
    setError(null);
  };

  const openEdit = (item: CatalogManagerItem) => {
    setEditorMode("edit");

    if (isStandard) {
      setStandardDraft(standardFromItem(item as StandardCatalogItem));
    } else {
      setConfiguratorDraft(configuratorFromItem(item as ConfiguratorCatalogItem));
    }

    setShowAdvancedJson(false);
    setError(null);
  };

  const closeEditor = useCallback(() => {
    setEditorMode(null);
    setShowAdvancedJson(false);
    setSaving(false);
  }, []);

  const handleSave = async () => {
    if (readOnly) {return;}

    setSaving(true);
    setError(null);

    try {
      const validationError = isStandard
        ? validateStandardDraft(standardDraft)
        : validateConfiguratorDraft(configuratorDraft, configuratorJsonErrors);

      if (validationError) {
        if (!isStandard) {setShowAdvancedJson(true);}
        throw new Error(validationError);
      }

      if (isStandard) {
        const payload = standardDraftToPayload(standardDraft);
        if (editorMode === "create") {
          unwrapActionResult(
            await createStandardItem(payload),
            "Failed to save catalog item",
          );
        } else {
          if (!standardDraft.id) {throw new Error("Missing item id");}
          unwrapActionResult(
            await patchStandardItem({ ...payload, id: standardDraft.id }),
            "Failed to save catalog item",
          );
        }
      } else {
        const payload = configuratorDraftToPayload(configuratorDraft);
        if (editorMode === "create") {
          unwrapActionResult(
            await createConfiguratorItem(payload),
            "Failed to save catalog item",
          );
        } else {
          if (!configuratorDraft.id) {throw new Error("Missing item id");}
          unwrapActionResult(
            await patchConfiguratorItem({ ...payload, id: configuratorDraft.id }),
            "Failed to save catalog item",
          );
        }
      }

      closeEditor();
      await loadItems();
      void useCatalogStore.getState().refresh().catch((hydrateError: unknown) => {
        setError(hydrateError instanceof Error ? hydrateError.message : "Failed to refresh planner catalog");
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save item");
      setSaving(false);
    }
  };

  const handleToggleVisible = async (item: CatalogManagerItem) => {
    if (readOnly || !item.id) {return;}

    setPendingId(item.id);
    setError(null);

    try {
      if (isStandard) {
        const nextVisible =
          standardFromItem(item as StandardCatalogItem).visible === false;
        unwrapActionResult(
          await patchStandardItem({ id: item.id, visible: nextVisible }),
          "Failed to update visibility",
        );
      } else {
        const nextVisible = item.active === false;
        unwrapActionResult(
          await setConfiguratorActive({ id: item.id, active: nextVisible }),
          "Failed to update visibility",
        );
      }
      await loadItems();
      void useCatalogStore.getState().refresh().catch((hydrateError: unknown) => {
        setError(hydrateError instanceof Error ? hydrateError.message : "Failed to refresh planner catalog");
      });
    } catch (toggleError) {
      setError(
        toggleError instanceof Error ? toggleError.message : "Failed to update visibility",
      );
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (item: CatalogManagerItem) => {
    if (readOnly || !item.id) {return;}

    if (
      !window.confirm(
        `Delete "${item.name}"? This cannot be undone for standard catalog items.`,
      )
    ) {
      return;
    }

    setPendingId(item.id);
    setError(null);

    try {
      if (isStandard) {
        unwrapActionResult(
          await deleteStandardItem({ id: item.id }),
          "Failed to delete item",
        );
      } else {
        unwrapActionResult(
          await deleteConfiguratorItem({ id: item.id }),
          "Failed to delete item",
        );
      }
      if (editorMode === "edit") {closeEditor();}
      await loadItems();
      void useCatalogStore.getState().refresh().catch((hydrateError: unknown) => {
        setError(hydrateError instanceof Error ? hydrateError.message : "Failed to refresh planner catalog");
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete item");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="admin-page" data-testid="admin-catalog-page">
      <header className="admin-page__header" data-testid="admin-shell-header">
        <div>
          <p className="admin-page__eyebrow" data-testid="admin-shell-scope">
            Catalog admin · {isStandard ? "managed products" : "configurator SKUs"} ·
            editable
          </p>
          <h1 className="admin-page__title" data-testid="admin-shell-title">
            {title}
          </h1>
          <p className="admin-page__copy">{description}</p>
          <p className="admin-page__meta" data-testid="admin-shell-source">
            Source:{" "}
            {source ? (
              <code>{source}</code>
            ) : (
              <span>loading…</span>
            )}
            {readOnly
              ? " · read-only (local fallback — edits disabled until managed products are connected)"
              : " · editable"}
          </p>
          <p
            className="admin-page__meta"
            role="status"
            data-testid="admin-shell-state"
          >
            State:{" "}
            <strong>{displayTotal}</strong> shown
            {hasActiveFilters ? " (filtered)" : ""} ·{" "}
            {readOnly ? "read-only" : "editable"}
          </p>
        </div>
        <div className="admin-page__actions" data-testid="admin-shell-actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadItems()}
            disabled={shellActionsReady && loading}
          >
            {loading ? (
              <Loader2 size={14} className="admin-icon-spin" aria-hidden />
            ) : (
              <RefreshCw size={14} className="admin-icon-static" aria-hidden />
            )}
            Refresh
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openCreate}
            disabled={shellActionsReady && readOnly}
            data-testid="admin-shell-primary-action"
          >
            <Plus size={14} aria-hidden />
            Add item
          </Button>
        </div>
      </header>

      {readOnly ? (
        <AdminAlert variant="warn" role="status">
          Read-only local catalog. Writes are disabled until the managed product
          source is connected. You can still search and review rows.
        </AdminAlert>
      ) : null}

      {error ? <AdminAlert variant="error">{error}</AdminAlert> : null}

      <div className="admin-toolbar">
        <AdminField label="Search" className="admin-field--search">
          <div className="min-w-[12.5rem]">
            <Search size={14} className="admin-field__search-icon" />
            <AdminTextInput
              type="search"
              value={search}
              onChange={(event) => {
                setFilterState({ ...filterState, search: event.target.value, page: 1 });
              }}
              className="admin-field__input--search"
              placeholder="Name, category..."
            />
          </div>
        </AdminField>
        <AdminField label="Category">
          <AdminSelect
            value={categoryFilter}
            onChange={(event) => {
              setFilterState({ ...filterState, category: event.target.value, page: 1 });
            }}
            className="min-w-[8.75rem]"
          >
            <option value="">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </AdminSelect>
        </AdminField>
        <AdminField label="Status">
          <AdminSelect
            value={visibleFilter}
            onChange={(event) => {
              setFilterState({
                ...filterState,
                visible: event.target.value as "" | "true" | "false",
                page: 1,
              });
            }}
            className="min-w-[7.5rem]"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Hidden</option>
          </AdminSelect>
        </AdminField>
      </div>

      {loading && items.length === 0 ? (
        <AdminLoadingPanel
          title={`Loading ${isStandard ? "standard" : "configurator"} catalog…`}
          copy="Fetching products from the admin catalog API. This list is for editable inventory — not the read-only workspace element library."
          data-testid="admin-catalog-loading"
        >
          <div className="admin-loading-skeleton" aria-hidden>
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row" />
            <div className="admin-loading-skeleton__row admin-loading-skeleton__row--short" />
          </div>
        </AdminLoadingPanel>
      ) : error && items.length === 0 ? (
        <div
          className="admin-empty"
          role="alert"
          data-testid="admin-catalog-error-empty"
        >
          <p className="admin-empty__title">Could not load catalog</p>
          <p className="admin-empty__copy">
            {error}. Check that the products database (or local fallback) is
            available, then retry. This page manages{" "}
            {isStandard ? "planner-managed products" : "configurator SKUs"} only.
          </p>
          <div className="admin-empty__actions">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void loadItems()}
              data-testid="admin-catalog-retry"
            >
              <RefreshCw size={14} aria-hidden />
              Retry load
            </Button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div
          className="admin-empty"
          role="status"
          data-testid="admin-catalog-empty"
        >
          <p className="admin-empty__title">
            {isStandard
              ? "No managed products yet"
              : "No configurator SKUs yet"}
          </p>
          <p className="admin-empty__copy">
            {readOnly
              ? "The catalog source returned no rows (local fallback is connected but empty). Connect managed products or seed inventory to edit here."
              : isStandard
                ? "Add a managed product for the planner library: dimensions, mesh, price, and visibility. SVG symbols and the read-only workspace element library are separate routes."
                : "Add a configurator SKU with sizing type, options, or footprint. Standard managed products and the read-only workspace element library are separate routes."}
          </p>
          <p className="admin-page__meta">
            Data source: <code>{source ?? "unreported"}</code>
          </p>
          <div className="admin-empty__actions">
            {!readOnly ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={openCreate}
                data-testid="admin-catalog-empty-add"
              >
                <Plus size={14} aria-hidden />
                Add item
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadItems()}
              data-testid="admin-catalog-empty-refresh"
            >
              <RefreshCw size={14} aria-hidden />
              Refresh
            </Button>
          </div>
        </div>
      ) : displayItems.length === 0 ? (
        <div
          className="admin-empty"
          role="status"
          data-testid="admin-catalog-filter-empty"
        >
          <p className="admin-empty__title">No items match these filters</p>
          <p className="admin-empty__copy">
            Change search, category, or status — or clear filters to see the full
            list.
          </p>
          {hasActiveFilters ? (
            <div className="admin-empty__actions">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFilters}
                data-testid="admin-catalog-clear-filters"
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <AdminCatalogTable
          items={displayItems}
          isStandard={isStandard}
          total={displayTotal}
          page={page}
          pendingId={pendingId}
          readOnly={readOnly}
          onEdit={openEdit}
          onToggleVisible={handleToggleVisible}
          onDelete={handleDelete}
          onPageChange={setPage}
        />
      )}

      <AdminCatalogEditorDrawer
        editorMode={editorMode}
        isStandard={isStandard}
        readOnly={readOnly}
        saving={saving}
        standardDraft={standardDraft}
        configuratorDraft={configuratorDraft}
        configuratorJsonErrors={configuratorJsonErrors}
        showAdvancedJson={showAdvancedJson}
        onToggleAdvancedJson={() => setShowAdvancedJson((current) => !current)}
        onClose={closeEditor}
        onSave={handleSave}
        onStandardDraftChange={setStandardDraft}
        onConfiguratorDraftChange={setConfiguratorDraft}
      />
    </div>
  );
}
