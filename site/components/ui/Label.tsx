import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, htmlFor, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className={cn("admin-field__label", className)}
      {...props}
    />
  );
}

export { Label };
