import * as React from "react";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type IconButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "aria-label" | "size"
> & {
  readonly label: string;
  readonly size?: "icon-xs" | "icon-sm" | "icon" | "icon-lg";
};

function IconButton({
  label,
  title,
  size = "icon-sm",
  variant = "ghost",
  className,
  ...props
}: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={title ?? label}
      size={size}
      variant={variant}
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

export { IconButton };
