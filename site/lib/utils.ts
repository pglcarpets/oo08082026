import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-aware class name joiner, imported across the site/admin trees as
 * `@/lib/utils`. Restored here after the fork refactor removed its previous
 * home at `site/lib/shared/cn.ts`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
