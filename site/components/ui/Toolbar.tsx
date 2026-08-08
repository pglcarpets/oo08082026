import { cn } from "@/lib/utils";

/** FOCSS toolbar strip — no Radix. */
export function Toolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="toolbar"
      data-slot="toolbar"
      className={cn("admin-actions-row", className)}
      {...props}
    />
  );
}
