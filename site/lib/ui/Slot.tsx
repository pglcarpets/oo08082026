import * as React from "react";

import { cn } from "@/lib/utils";

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref !== null && ref !== undefined) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

/** Polymorphic child merge — replaces @radix-ui/react-slot for Button `asChild`. */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, className, ...props }, forwardedRef) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<{
      className?: string;
      ref?: React.Ref<HTMLElement>;
    }>;

    return React.cloneElement(child, {
      ...props,
      ...child.props,
      className: cn(className, child.props.className),
      ref: mergeRefs(forwardedRef, child.props.ref),
    });
  },
);
Slot.displayName = "Slot";