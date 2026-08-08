import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "admin-field__control admin-field__control--multiline",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
