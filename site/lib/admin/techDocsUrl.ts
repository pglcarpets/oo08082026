/**
 * Public URL for the tech-docs generator SPA.
 *
 * - Production default: Vercel SPA host (works today).
 *   Preferred custom host docs.oando.co.in is blocked by Cloudflare 525 until
 *   DNS/CNAME + SSL are pointed at this Vercel project (OPS-S01 / F3).
 * - Development default: http://localhost:3001 (`pnpm run tech-docs:dev`, never :3000)
 * - Override anytime: NEXT_PUBLIC_TECH_DOCS_URL
 */
export const DEFAULT_TECH_DOCS_URL = "https://techdocsgenerator.vercel.app";
/** Vite tech-docs dev server — fixed in tech-docs-generator/vite.config.ts */
export const DEV_TECH_DOCS_URL = "http://localhost:3001";

export function getTechDocsPublicUrl(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const raw = (env.NEXT_PUBLIC_TECH_DOCS_URL || "").trim().replace(/\/+$/, "");
  const fallback =
    env.NODE_ENV === "production" ? DEFAULT_TECH_DOCS_URL : DEV_TECH_DOCS_URL;

  if (!raw) {
    return fallback;
  }
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }
    return (
      parsed.origin +
      (parsed.pathname === "/"
        ? ""
        : parsed.pathname.replace(/\/+$/, ""))
    );
  } catch {
    return fallback;
  }
}

export function isExternalAdminHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
