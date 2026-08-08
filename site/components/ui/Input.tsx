import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = () => "admin-field__control";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(inputVariants(), className)}
        {...props}
      />
    );
  },
);

export { Input, inputVariants };
