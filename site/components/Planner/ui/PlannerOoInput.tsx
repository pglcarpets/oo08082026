"use client";

import {
  Input as AriaInput,
  type InputProps as AriaInputProps,
  TextArea as AriaTextArea,
  type TextAreaProps as AriaTextAreaProps,
} from "react-aria-components";
import { clsx } from "clsx";

/** Minimal FOCSS-styled React Aria Input. */
export function OoInput({ className, ...props }: AriaInputProps & { className?: string }) {
  return <AriaInput {...props} className={clsx("input", className)} />;
}

/** Minimal FOCSS-styled React Aria TextArea. */
export function OoTextArea({
  className,
  ...props
}: AriaTextAreaProps & { className?: string }) {
  return <AriaTextArea {...props} className={clsx("input", className)} />;
}
