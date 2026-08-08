"use client";

import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaretDown as ChevronDown, CaretUp as ChevronUp, CircleNotch as Loader2, FloppyDisk as Save, X } from "@phosphor-icons/react";

import { Button } from "@/components/ui/Button";
import {
  AdminCheckbox,
  AdminField,
  AdminFieldGroup,
  AdminNumberInput,
  AdminSelect,
  AdminTextarea,
  AdminTextInput,
} from "../ui/AdminFormFields";
import {
  CONFIGURATOR_CATEGORIES,
  MESH_TYPES,
  STANDARD_CATEGORIES,
  type ConfiguratorDraft,
  type ConfiguratorJsonErrors,
  type EditorMode,
  type StandardDraft,
} from "./adminCatalogManagerUtils";
import {
  STANDARD_CATALOG_FORM_ID,
  standardCatalogFormSchema,
  type StandardCatalogFormValues,
} from "./standardCatalogFormSchema";
import {
  CONFIGURATOR_CATALOG_FORM_ID,
  configuratorCatalogFormSchema,
  type ConfiguratorCatalogFormValues,
} from "./configuratorCatalogFormSchema";
import { WorkstationFamilyAuthorFields } from "../workstation/WorkstationFamilyAuthorFields";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <span className="text-xs text-danger" role="alert">
      {message}
    </span>
  );
}

function JsonFieldMessage({ error }: { error?: string }) {
  if (!error) {
    return <span className="text-xs text-soft">Valid JSON.</span>;
  }

  return (
    <span className="text-xs text-danger" role="alert">
      {error}
    </span>
  );
}

function draftToFormValues(draft: StandardDraft): StandardCatalogFormValues {
  return {
    id: draft.id,
    name: draft.name,
    category: draft.category,
    subcategory: draft.subcategory,
    description: draft.description,
    width_mm: draft.width_mm,
    depth_mm: draft.depth_mm,
    height_mm: draft.height_mm,
    price: draft.price,
    mesh_type: draft.mesh_type,
    image_url: draft.image_url,
    visible: draft.visible,
  };
}

function StandardCatalogForm({
  draft,
  onChange,
  onValidSubmit,
  readOnly,
}: {
  draft: StandardDraft;
  onChange: (next: StandardDraft) => void;
  onValidSubmit: () => void | Promise<void>;
  readOnly?: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StandardCatalogFormValues>({
    resolver: zodResolver(standardCatalogFormSchema),
    values: draftToFormValues(draft),
    mode: "onSubmit",
  });

  const syncField = <K extends keyof StandardDraft>(key: K, value: StandardDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };

  return (
    <form
      id={STANDARD_CATALOG_FORM_ID}
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(() => {
        void onValidSubmit();
      })}
    >
      <AdminFieldGroup title="Identity">
        <AdminField label="Name *">
          <AdminTextInput
            {...register("name", {
              onChange: (event) => syncField("name", event.target.value),
            })}
            disabled={readOnly}
            placeholder="Linear workstation 4-seat"
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name?.message} />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Category *">
            <AdminSelect
              {...register("category", {
                onChange: (event) => syncField("category", event.target.value),
              })}
              disabled={readOnly}
              aria-invalid={Boolean(errors.category)}
            >
              {STANDARD_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </AdminSelect>
            <FieldError message={errors.category?.message} />
          </AdminField>
          <AdminField label="Subcategory / shape">
            <AdminTextInput
              {...register("subcategory", {
                onChange: (event) => syncField("subcategory", event.target.value),
              })}
              disabled={readOnly}
              placeholder="straight-bench"
            />
          </AdminField>
        </div>
        <AdminField label="Description">
          <AdminTextarea
            {...register("description", {
              onChange: (event) => syncField("description", event.target.value),
            })}
            disabled={readOnly}
            rows={3}
            className="font-sans text-sm"
          />
        </AdminField>
      </AdminFieldGroup>

      <AdminFieldGroup title="Footprint (mm)">
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminField label="Width *">
            <AdminNumberInput
              {...register("width_mm", {
                onChange: (event) => syncField("width_mm", event.target.value),
              })}
              disabled={readOnly}
              min={1}
              aria-invalid={Boolean(errors.width_mm)}
            />
            <FieldError message={errors.width_mm?.message} />
          </AdminField>
          <AdminField label="Depth *">
            <AdminNumberInput
              {...register("depth_mm", {
                onChange: (event) => syncField("depth_mm", event.target.value),
              })}
              disabled={readOnly}
              min={1}
              aria-invalid={Boolean(errors.depth_mm)}
            />
            <FieldError message={errors.depth_mm?.message} />
          </AdminField>
          <AdminField label="Height *">
            <AdminNumberInput
              {...register("height_mm", {
                onChange: (event) => syncField("height_mm", event.target.value),
              })}
              disabled={readOnly}
              min={1}
              aria-invalid={Boolean(errors.height_mm)}
            />
            <FieldError message={errors.height_mm?.message} />
          </AdminField>
        </div>
      </AdminFieldGroup>

      <AdminFieldGroup title="Commerce & render">
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Price (INR)">
            <AdminNumberInput
              {...register("price", {
                onChange: (event) => syncField("price", event.target.value),
              })}
              disabled={readOnly}
              min={0}
              aria-invalid={Boolean(errors.price)}
            />
            <FieldError message={errors.price?.message} />
          </AdminField>
          <AdminField label="Mesh type">
            <AdminSelect
              {...register("mesh_type", {
                onChange: (event) => syncField("mesh_type", event.target.value),
              })}
              disabled={readOnly}
            >
              {MESH_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </div>
        <AdminField label="Image URL">
          <AdminTextInput
            {...register("image_url", {
              onChange: (event) => syncField("image_url", event.target.value),
            })}
            disabled={readOnly}
            placeholder="https://..."
          />
        </AdminField>
        <Controller
          name="visible"
          control={control}
          render={({ field }) => (
            <AdminCheckbox
              label="Visible in planner catalog"
              checked={field.value}
              disabled={readOnly}
              onChange={(visible) => {
                field.onChange(visible);
                syncField("visible", visible);
              }}
            />
          )}
        />
      </AdminFieldGroup>
    </form>
  );
}

function ConfiguratorCatalogForm({
  draft,
  onChange,
  onValidSubmit,
  readOnly,
  showAdvancedJson,
  onToggleAdvancedJson,
  jsonErrors,
}: {
  draft: ConfiguratorDraft;
  onChange: (next: ConfiguratorDraft) => void;
  onValidSubmit: () => void | Promise<void>;
  readOnly?: boolean;
  showAdvancedJson: boolean;
  onToggleAdvancedJson: () => void;
  jsonErrors: ConfiguratorJsonErrors;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfiguratorCatalogFormValues>({
    resolver: zodResolver(configuratorCatalogFormSchema),
    values: { name: draft.name, category: draft.category },
    mode: "onSubmit",
  });

  const set = <K extends keyof ConfiguratorDraft>(key: K, value: ConfiguratorDraft[K]) =>
    onChange({ ...draft, [key]: value });
  const jsonIssueCount = Object.keys(jsonErrors).length;

  return (
    <form
      id={CONFIGURATOR_CATALOG_FORM_ID}
      className="space-y-4"
      noValidate
      onSubmit={handleSubmit(() => {
        void onValidSubmit();
      })}
    >
      <AdminFieldGroup title="Identity">
        <AdminField label="Name *">
          <AdminTextInput
            {...register("name", {
              onChange: (event) => set("name", event.target.value),
            })}
            disabled={readOnly}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name?.message} />
        </AdminField>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Slug" hint="Auto-generated from name if empty">
            <AdminTextInput
              value={draft.slug}
              disabled={readOnly}
              onChange={(event) => set("slug", event.target.value)}
            />
          </AdminField>
          <AdminField label="Category *">
            <AdminSelect
              {...register("category", {
                onChange: (event) => set("category", event.target.value),
              })}
              disabled={readOnly}
              aria-invalid={Boolean(errors.category)}
            >
              {CONFIGURATOR_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </AdminSelect>
            <FieldError message={errors.category?.message} />
          </AdminField>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField label="Family">
            <AdminTextInput
              value={draft.family}
              disabled={readOnly}
              onChange={(event) => set("family", event.target.value)}
            />
          </AdminField>
          <AdminField label="Brand name">
            <AdminTextInput
              value={draft.brand_name}
              disabled={readOnly}
              onChange={(event) => set("brand_name", event.target.value)}
            />
          </AdminField>
        </div>
        <AdminField label="Description">
          <AdminTextarea
            value={draft.description}
            disabled={readOnly}
            onChange={(event) => set("description", event.target.value)}
            rows={3}
            className="font-sans text-sm"
          />
        </AdminField>
      </AdminFieldGroup>

      <AdminFieldGroup title="Sizing model">
        <AdminField label="Sizing type *">
          <AdminSelect
            value={draft.sizing_type}
            disabled={readOnly}
            onChange={(event) =>
              set("sizing_type", event.target.value as ConfiguratorDraft["sizing_type"])
            }
          >
            <option value="parametric">parametric (workstation spec)</option>
            <option value="discrete">discrete (size options list)</option>
            <option value="fixed">fixed (single footprint)</option>
          </AdminSelect>
        </AdminField>

        <div className="rounded-lg border border-soft bg-panel p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-strong">Advanced JSON sizing data</p>
              <p className="text-xs text-muted">
                Raw configurator payloads stay collapsed until you need to edit workstation,
                size option, or footprint JSON directly.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleAdvancedJson}
              aria-expanded={showAdvancedJson}
            >
              {showAdvancedJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAdvancedJson ? "Hide JSON" : "Show JSON"}
            </Button>
          </div>
          <p className={`mt-2 text-xs ${jsonIssueCount ? "text-danger" : "text-soft"}`}>
            {jsonIssueCount
              ? `${jsonIssueCount} JSON field${jsonIssueCount === 1 ? "" : "s"} need attention before save.`
              : "JSON validates as you type before save."}
          </p>
        </div>

        {draft.sizing_type === "parametric" ? (
          <WorkstationFamilyAuthorFields
            workstationJson={draft.workstationJson}
            readOnly={readOnly}
            onWorkstationJsonChange={(next) => set("workstationJson", next)}
          />
        ) : null}

        {showAdvancedJson ? (
          <div className="space-y-3">
            {draft.sizing_type === "parametric" ? (
              <AdminField
                label="Workstation JSON (raw)"
                hint="Advanced override — structured fields above are preferred"
              >
                <AdminTextarea
                  value={draft.workstationJson}
                  disabled={readOnly}
                  onChange={(event) => set("workstationJson", event.target.value)}
                  rows={14}
                />
                <JsonFieldMessage error={jsonErrors.workstationJson} />
              </AdminField>
            ) : null}

            {draft.sizing_type === "discrete" ? (
              <AdminField
                label="Size options JSON *"
                hint='[{ "sku", "label", "dim": { "L", "D", "H?" } }]'
              >
                <AdminTextarea
                  value={draft.sizeOptionsJson}
                  disabled={readOnly}
                  onChange={(event) => set("sizeOptionsJson", event.target.value)}
                  rows={12}
                />
                <JsonFieldMessage error={jsonErrors.sizeOptionsJson} />
              </AdminField>
            ) : null}

            {draft.sizing_type === "fixed" ? (
              <AdminField
                label="Default footprint JSON *"
                hint='{ "L", "D", "H?" } in millimetres'
              >
                <AdminTextarea
                  value={draft.defaultFootprintJson}
                  disabled={readOnly}
                  onChange={(event) => set("defaultFootprintJson", event.target.value)}
                  rows={6}
                />
                <JsonFieldMessage error={jsonErrors.defaultFootprintJson} />
              </AdminField>
            ) : null}

            <AdminField label="Derived rules JSON (optional)" hint="Screen/modesty offsets">
              <AdminTextarea
                value={draft.derivedRulesJson}
                disabled={readOnly}
                onChange={(event) => set("derivedRulesJson", event.target.value)}
                rows={5}
              />
              <JsonFieldMessage error={jsonErrors.derivedRulesJson} />
            </AdminField>
          </div>
        ) : null}
      </AdminFieldGroup>

      <AdminFieldGroup title="Assets">
        <AdminField label="Materials" hint="Comma-separated">
          <AdminTextInput
            value={draft.materials}
            disabled={readOnly}
            onChange={(event) => set("materials", event.target.value)}
          />
        </AdminField>
        <AdminField label="Thumbnail URL">
          <AdminTextInput
            value={draft.thumbnail_url}
            disabled={readOnly}
            onChange={(event) => set("thumbnail_url", event.target.value)}
          />
        </AdminField>
        <AdminField
          label="3D model URL (system-generated only)"
          hint="catalog-assets/generated/* from extrude/modular export — designer static GLB not allowed"
        >
          <AdminTextInput
            value={draft.model_3d_url}
            disabled={readOnly}
            onChange={(event) => set("model_3d_url", event.target.value)}
            placeholder="…/catalog-assets/generated/….glb"
          />
        </AdminField>
        <AdminCheckbox
          label="Active in configurator"
          checked={draft.active}
          disabled={readOnly}
          onChange={(active) => set("active", active)}
        />
      </AdminFieldGroup>
    </form>
  );
}

type Props = {
  editorMode: EditorMode;
  isStandard: boolean;
  readOnly: boolean;
  saving: boolean;
  standardDraft: StandardDraft;
  configuratorDraft: ConfiguratorDraft;
  configuratorJsonErrors: ConfiguratorJsonErrors;
  showAdvancedJson: boolean;
  onToggleAdvancedJson: () => void;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  onStandardDraftChange: (next: StandardDraft) => void;
  onConfiguratorDraftChange: (next: ConfiguratorDraft) => void;
};

export function AdminCatalogEditorDrawer({
  editorMode,
  isStandard,
  readOnly,
  saving,
  standardDraft,
  configuratorDraft,
  configuratorJsonErrors,
  showAdvancedJson,
  onToggleAdvancedJson,
  onClose,
  onSave,
  onStandardDraftChange,
  onConfiguratorDraftChange,
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorMode) {return;}

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const dialog = dialogRef.current;
    const backdrop = backdropRef.current;
    const siblings = backdrop?.parentElement
      ? Array.from(backdrop.parentElement.children).filter((node) => node !== backdrop)
      : [];
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    for (const sibling of siblings) {
      if (sibling instanceof HTMLElement) {sibling.inert = true;}
    }

    const focusable = () =>
      dialog
        ? Array.from(
            dialog.querySelectorAll<HTMLElement>(
              'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((node) => node.tabIndex !== -1)
        : [];

    focusable()[0]?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") {return;}

      const nodes = focusable();
      if (nodes.length === 0) {return;}
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      for (const sibling of siblings) {
        if (sibling instanceof HTMLElement) {sibling.inert = false;}
      }
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [editorMode, onClose]);

  if (!editorMode) {return null;}

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] flex justify-end bg-scrim"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {onClose();}
      }}
    >
      <div
        ref={dialogRef}
        className="flex h-dvh w-full max-w-2xl flex-col border-l border-[var(--border-soft)] bg-[var(--surface-card)] shadow-[var(--shadow-lift)]"
        role="dialog"
        aria-modal="true"
        aria-label={editorMode === "create" ? "Create catalog item" : "Edit catalog item"}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-soft)_40%,var(--surface-panel))] p-4 sm:px-6">
          <h2 className="admin-type-page">
            {editorMode === "create" ? "New catalog item" : "Edit catalog item"}
          </h2>
          <Button type="button" variant="outline" size="icon-sm" onClick={onClose} aria-label="Close">
            <X size={16} aria-hidden />
          </Button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--surface-card)] p-4 sm:p-6">
          {isStandard ? (
            <StandardCatalogForm
              draft={standardDraft}
              onChange={onStandardDraftChange}
              onValidSubmit={onSave}
              readOnly={readOnly}
            />
          ) : (
            <ConfiguratorCatalogForm
              draft={configuratorDraft}
              onChange={onConfiguratorDraftChange}
              onValidSubmit={onSave}
              readOnly={readOnly}
              showAdvancedJson={showAdvancedJson}
              onToggleAdvancedJson={onToggleAdvancedJson}
              jsonErrors={configuratorJsonErrors}
            />
          )}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-soft)] bg-[color-mix(in_srgb,var(--surface-soft)_35%,var(--surface-panel))] p-4 sm:px-6">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          {isStandard ? (
            <Button
              type="submit"
              form={STANDARD_CATALOG_FORM_ID}
              variant="primary"
              size="sm"
              disabled={readOnly || saving}
            >
              {saving ? <Loader2 size={14} className="admin-icon-spin" aria-hidden /> : <Save size={14} aria-hidden />}
              {editorMode === "create" ? "Create" : "Save changes"}
            </Button>
          ) : (
            <Button
              type="submit"
              form={CONFIGURATOR_CATALOG_FORM_ID}
              variant="primary"
              size="sm"
              disabled={readOnly || saving}
            >
              {saving ? <Loader2 size={14} className="admin-icon-spin" aria-hidden /> : <Save size={14} aria-hidden />}
              {editorMode === "create" ? "Create" : "Save changes"}
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

