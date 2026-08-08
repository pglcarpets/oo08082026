"use client";

import {
  createContext,
  useContext,
  useId,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

/**
 * Admin form shell — FOCSS classes only (no shadcn/Radix registry).
 * Tokens/surfaces live in `focss/admin/base/{primitives,type}.css`.
 */

type AdminFieldContextValue = {
  fieldId: string;
  label: string;
};

const AdminFieldContext = createContext<AdminFieldContextValue | null>(null);

function useAdminFieldControlProps(explicitId?: string): {
  id?: string;
  "aria-label"?: string;
} {
  const ctx = useContext(AdminFieldContext);
  if (!ctx) {
    return explicitId ? { id: explicitId } : {};
  }
  const id = explicitId ?? ctx.fieldId;
  // When nested under AdminField, id matches the visible label's htmlFor.
  return { id };
}

export function AdminFieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="admin-field-group">
      <legend className="admin-field-group__title">{title}</legend>
      {children}
    </fieldset>
  );
}

export function AdminField({
  label,
  hint,
  className,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  const autoId = useId();
  const fieldId = htmlFor ?? autoId;

  return (
    <AdminFieldContext.Provider value={{ fieldId, label }}>
      <div className={cn("admin-field", className)}>
        <label className="admin-field__label" htmlFor={fieldId}>
          {label}
        </label>
        {children}
        {hint ? <p className="admin-field__help">{hint}</p> : null}
      </div>
    </AdminFieldContext.Provider>
  );
}

export function AdminTextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, id, ...rest } = props;
  const control = useAdminFieldControlProps(id);
  return (
    <input
      {...rest}
      id={control.id}
      className={cn("admin-field__control", className)}
    />
  );
}

export function AdminNumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, id, ...rest } = props;
  const control = useAdminFieldControlProps(id);
  return (
    <input
      type="number"
      {...rest}
      id={control.id}
      className={cn("admin-field__control", className)}
    />
  );
}

export function AdminTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, id, ...rest } = props;
  const control = useAdminFieldControlProps(id);
  return (
    <textarea
      {...rest}
      id={control.id}
      className={cn(
        "admin-field__control admin-field__control--multiline admin-field__control--mono",
        className,
      )}
    />
  );
}

export function AdminSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, id, "aria-label": ariaLabel, ...rest } = props;
  const control = useAdminFieldControlProps(id);
  const ctx = useContext(AdminFieldContext);
  // Prefer id+label association; fall back to aria-label if used outside AdminField.
  const resolvedAriaLabel =
    ariaLabel ?? (control.id ? undefined : ctx?.label);
  return (
    <select
      {...rest}
      id={control.id}
      aria-label={resolvedAriaLabel}
      className={cn("admin-field__control", className)}
    />
  );
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const id = useId();

  return (
    <label className="admin-checkbox" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="admin-checkbox__input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
