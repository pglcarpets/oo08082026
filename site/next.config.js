const createNextIntlPlugin = require("next-intl/plugin");
const path = require("path");

// Load monorepo-root `.env.local` before Next's project-dir env load.
require("../scripts/general/loadEnvLocal.cjs").loadEnvLocal();

// Default next-intl path. Needed at repo-root cwd (`next build site` validates
// against process.cwd()) via root `i18n/request.ts` re-export, and under the
// `site/` app dir as the real module. Do not use `./site/i18n/...` here — when
// Next's webpack context is already `site/`, that doubles the prefix.
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const baseConfig = require("../config/build/next.config.js");

const monorepoRoot = path.join(/* turbopackIgnore: true */ __dirname, "..");

// Merge experimental so fork-required TypeScript 7 CLI flag cannot be dropped
// if baseConfig.experimental is ever slimmed.
const experimental = {
  ...(baseConfig.experimental),
  useTypeScriptCli: true,
};

module.exports = withNextIntl({
  ...baseConfig,
  experimental,
  // Optional isolated distDir for quiet multi-agent probes (e.g. OANDO_NEXT_DIST=.next-3010).
  // Unset → default `.next` (shared with the primary `pnpm run dev` on :3000).
  ...(process.env.OANDO_NEXT_DIST
    ? { distDir: process.env.OANDO_NEXT_DIST }
    : {}),
  // NFT still monorepo-aware; default dev is webpack (see package.json "dev").
  // turbo (dev:turbo) inherits baseConfig.turbopack — use sparingly (RAM risk).
  outputFileTracingRoot: monorepoRoot,
});
