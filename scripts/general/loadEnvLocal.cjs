const fs = require("node:fs");
const path = require("node:path");
const { config: loadEnv } = require("dotenv");

const repoRoot = path.join(__dirname, "..", "..");
const siteRoot = path.join(repoRoot, "site");

/** Load repo-root `.env.local` (source of truth) + alias sync. */
function loadEnvLocal() {
  const rootEnv = path.join(repoRoot, ".env.local");
  if (fs.existsSync(rootEnv)) {
    loadEnv({ path: rootEnv, override: false, quiet: true });
  }
  loadEnv({ override: false, quiet: true });

  const { syncWorkstationEnvAliases } = require("./workstation-env.mjs");
  syncWorkstationEnvAliases(process.env);

  if (
    !process.env.OPENROUTER_API_KEY_PRIMARY?.trim() &&
    process.env.OPENROUTER_API_KEY?.trim()
  ) {
    process.env.OPENROUTER_API_KEY_PRIMARY = process.env.OPENROUTER_API_KEY.trim();
  }
}

module.exports = { loadEnvLocal, siteRoot, repoRoot };
