"use client";

/**
 * react-hook-form helpers — FOCSS labels/messages only. No Radix Slot.
 */
import * as React from "react";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn("admin-field", className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  htmlFor: _htmlFor,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();

  // Always pair with FormControl's formItemId. Consumer htmlFor is ignored so
  // labels cannot drift from the control id (axe label / label-title-only / select-name).
  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn(error && "admin-field__label--error", className)}
      {...props}
      htmlFor={formItemId}
    />
  );
}

function FormControl({
  children,
}: {
  children: React.ReactElement<{
    id?: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }>;
}) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
  const childDescribedBy = children.props["aria-describedby"];
  const rhfDescribedBy = !error
    ? formDescriptionId
    : `${formDescriptionId} ${formMessageId}`;
  const describedBy = [childDescribedBy, rhfDescribedBy]
    .filter(Boolean)
    .join(" ")
    .trim();

  return React.cloneElement(children, {
    id: formItemId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": children.props["aria-invalid"] ?? !!error,
  });
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("admin-field__help", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("admin-field__error", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
