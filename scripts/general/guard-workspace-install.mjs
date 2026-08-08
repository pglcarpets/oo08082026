/**
 * Block `npm install` (or yarn) inside workspace packages.
 * Install only from repo root: `pnpm install`
 */
const ua = process.env.npm_config_user_agent ?? "";

if (!ua.includes("pnpm")) {
  const pkgDir = process.cwd().replace(/\\/g, "/");
  console.error(
    [
      "Local npm/yarn install is not allowed in workspace packages.",
      `Current directory: ${pkgDir}`,
      "",
      "From the repo root run:",
      "  pnpm install",
      "",
      "Then use root scripts or pnpm --filter, e.g.:",
      "  pnpm dev",
      "  pnpm --filter oando-tech-docs dev",
    ].join("\n"),
  );
  process.exit(1);
}
